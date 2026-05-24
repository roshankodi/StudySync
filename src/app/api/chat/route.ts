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
You are an intelligent AI tutor and document assistant.

## CONTEXT
---
{context}
---

## CHAT HISTORY
---
{chatHistory}
---

## QUESTION
{question}

## RULES

1. If relevant information exists in CONTEXT:
   - Use it as the primary source.
   - Explain the answer naturally.
   - Include citations inline where appropriate.

2. If CONTEXT is incomplete:
   - First use available context.
   - Then provide additional explanation using general knowledge.
   - Clearly separate:
   
   "From uploaded documents:"
   
   and
   
   "Additional explanation:"

3. If no relevant document information exists:
   - Still answer normally using your knowledge.
   - Do NOT say:
   
   "Based on the provided documents, I cannot answer this question."

4. Behave like a tutor:
   - Explain concepts simply.
   - Use examples.
   - Break difficult ideas into steps.
   - Keep responses readable.

5. Citation format:

<citation source-id="[ID]"
file-page-number="[Page]"
file-id="[FILE_ID]"
cited-text="[QUOTE]">[ID]</citation>

6. Do NOT automatically generate YouTube links.

7. Never refuse unless the request is unsafe.

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

let searchResults;

try {
  searchResults = await qdrantClient.search(
    collectionName,
    {
      vector: queryEmbedding as number[],
      limit: 5,
      with_payload: true,
      filter:
        allRelevantFileIds &&
        allRelevantFileIds.length > 0
          ? {
              must: [
                {
                  key: "fileId",
                  match: {
                    any: allRelevantFileIds,
                  },
                },
              ],
            }
          : undefined,
    },
  );

  console.log(
    "Retrieved chunks:",
    searchResults.length,
  );

  console.log(
    "Filtered results:",
    searchResults.map((r) => ({
      score: r.score,
      preview:
        ((r.payload as { content?: string })
          ?.content ?? "")
          .substring(0, 100),
    })),
  );
} catch (err) {
  console.error(
    "Qdrant search error:",
    err,
  );

  throw err;
}

const context = searchResults
  .map((result, index) => {
    type PayloadType = {
      content?: string;
      fileId?: string;
      loc?: { pageNumber?: number };
    };

    const payload =
      result.payload as PayloadType;

    const content =
      payload?.content ?? "";

    const fileId =
      payload?.fileId ?? "";

    const pageNumber =
      payload?.loc?.pageNumber ?? 1;

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
