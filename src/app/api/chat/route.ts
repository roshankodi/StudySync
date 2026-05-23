import { google } from "@ai-sdk/google";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  smoothStream,
  streamText,
} from "ai";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const collectionName = "document-embeddings-hf";

const ensureCollectionExists = async () => {
  try {
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (collection) => collection.name === collectionName,
    );

    if (!collectionExists) {
      console.log(`Collection "${collectionName}" not found. Creating it...`);
      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: 384,
          distance: "Cosine",
        },
      });
      console.log(`Collection "${collectionName}" created successfully.`);
    }
  } catch (error) {
    console.error("Error ensuring collection exists:", error);
    throw error;
  }
};

const PROMPT = `
### IMPERATIVE:  
You are a world-class research assistant. Your task is to analyze the user's QUESTION based *exclusively* on the provided CONTEXT from documents and also generate a *perfect formatted and aligned response to the user.

## CONTEXT:
---
{context}
---

## CHAT HISTORY:
---
{chatHistory}
---

## QUESTION:
{question}

### INSTRUCTIONS:
1.  **Analyze the CONTEXT:** Answer the QUESTION using only the information within the CONTEXT section. Do not use any external knowledge.
2.  **Cite Sources:** For every piece of information you use from the CONTEXT, you MUST provide a precise citation.

3.  **Unique Citations:** Each citation must have a unique sequential number, even if multiple facts come from the same source. Do not repeat numbers. For example: [1], [2], [3], [4], etc.

4.  **No Information:** If the CONTEXT does not contain the answer, state clearly "Based on the provided documents, I cannot answer this question."

5.  **Formatting:** The response must be perfectly structured and formatted with consistent indentation. and dont show all the Citations at the end of the response.

6. **Academic or Subject Questions:**
   - If the QUESTION is related to an academic topic (e.g., science, math, literature, economics, technology, etc.), include a section at the end titled:
     **"🎥 Relevant YouTube Resources"**
     - List 2–3 YouTube video links that can help the user understand the topic further.
     - The videos must be *educational and reliable* (official channels, university lectures, or verified educators).


## CITATION RULES (APPLY STRICTLY):
-   Format: <citation source-id="[ID]" file-page-number="[Page Number]" file-id="[File ID]" cited-text="[Exact Quoted Text]">[ID]</citation>
-   Example: <citation source-id="1" file-page-number="5" file-id="e5232b9a-ab12..." cited-text="The company's revenue in 2023 was $1.2B.">[1]</citation>
`;

const requestSchema = z.object({
  message: z.string(),
  chatId: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Debug Redis and Qdrant env
    console.log("REDIS_URL:", process.env.REDIS_URL);
    console.log("QDRANT_URL:", process.env.QDRANT_URL);
    console.log(
      "QDRANT_API_KEY:",
      process.env.QDRANT_API_KEY ? "set" : "not set",
    );
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = (await req.json()) as unknown;
    const { message, chatId, fileIds } = requestSchema.parse(body);

    let currentChatId = chatId;
    let messageHistory: Array<{ role: "user" | "assistant"; content: string }> =
      [];

    if (currentChatId) {
      const existingMessages = await db.message.findMany({
        where: { chatId: currentChatId },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      });

      messageHistory = existingMessages.map((msg) => ({
        role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));
    } else {
      const chat = await db.chat.create({
        data: {
          userId: session.user.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        },
      });
      currentChatId = chat.id;
    }

    let validFileIds: string[] = [];
    if (fileIds && fileIds.length > 0) {
      const existingFiles = await db.file.findMany({
        where: {
          id: { in: fileIds },
          userId: session.user.id,
        },
        select: { id: true },
      });
      validFileIds = existingFiles.map((f) => f.id);

      if (validFileIds.length !== fileIds.length) {
        console.warn(
          `Some file IDs are invalid or don't belong to user. Requested: ${fileIds.length}, Valid: ${validFileIds.length}`,
        );
      }
    }

    await db.message.create({
      data: {
        chatId: currentChatId,
        role: "USER",
        content: message,
        messageFiles: {
          createMany: {
            data: validFileIds.map((fileId) => ({
              fileId,
            })),
          },
        },
      },
    });

    const queryEmbedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: message,
    });

    if (!Array.isArray(queryEmbedding)) {
      throw new Error("Failed to generate query embedding.");
    }
    const allRelevantFileIds =
      validFileIds.length > 0
        ? validFileIds
        : await db.message
            .findMany({
              where: { chatId: currentChatId },
              select: { messageFiles: { select: { fileId: true } } },
            })
            .then((msgs) =>
              msgs.flatMap((m) => m.messageFiles.map((f) => f.fileId)),
            );

    await ensureCollectionExists();

    // Debug Qdrant search payload
    console.log("Qdrant search payload:", {
      collectionName,
      vectorLength: Array.isArray(queryEmbedding)
        ? queryEmbedding.length
        : "not-an-array",
      vectorSample: Array.isArray(queryEmbedding)
        ? queryEmbedding.slice(0, 5)
        : queryEmbedding,
      filter:
        allRelevantFileIds && allRelevantFileIds.length > 0
          ? { must: [{ key: "fileId", match: { any: allRelevantFileIds } }] }
          : undefined,
    });

    let searchResult;
    try {
      searchResult = await qdrantClient.search(collectionName, {
        vector: queryEmbedding as number[],
        limit: 5,
        with_payload: true,
        filter:
          allRelevantFileIds && allRelevantFileIds.length > 0
            ? { must: [{ key: "fileId", match: { any: allRelevantFileIds } }] }
            : undefined,
      });
    } catch (err) {
      console.error("Qdrant search error:", err);
      throw err;
    }

    const context = searchResult
      .map((result, index) => {
        type PayloadType = {
          content?: string;
          fileId?: string;
          loc?: { pageNumber?: number };
        };

        const payload = result.payload as PayloadType;
        const content = payload?.content ?? "";
        const fileId = payload?.fileId ?? "";
        const pageNumber = payload?.loc?.pageNumber ?? 1;

        return `---
Source ID: ${index + 1}
File ID: ${fileId}
Page Number: ${pageNumber}
Content: ${content}
---`;
      })
      .join("\n\n");

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const model = google("gemini-2.5-flash");

        const chatHistoryString = messageHistory
          .map((msg) => `${msg.role}: ${msg.content}`)
          .join("\n");

        const finalPrompt = PROMPT.replace("{context}", context)
          .replace("{chatHistory}", chatHistoryString)
          .replace("{question}", message);

        const result = streamText({
          model,
          prompt: finalPrompt,
          temperature: 0.3,
          experimental_transform: smoothStream(),
          onFinish: () => {
            console.log("finished streaming");
          },
        });

        writer.merge(result.toUIMessageStream());
        const fullText = await result.text;

        writer.write({
          type: "data-chatId",
          data: {
            chatId: currentChatId,
          },
          transient: true,
        });

        if (fullText) {
          await db.message.create({
            data: {
              chatId: currentChatId,
              role: "ASSISTANT",
              content: fullText,
              messageSources: {
                createMany: {
                  data: allRelevantFileIds.map((id) => ({ fileId: id })),
                },
              },
            },
          });
        }
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
