import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";
import IORedis from "ioredis";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HfInference } from "@huggingface/inference";
import { QdrantClient } from "@qdrant/js-client-rest";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/server/db";

interface FileJobData {
  fileId: string;
}

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY ?? undefined,
});

const collectionName = "document-embeddings-hf";

async function ensureCollectionExists() {
  try {
    const collections = await qdrantClient.getCollections();

    const exists = collections.collections.some(
      (c) => c.name === collectionName,
    );

    if (!exists) {
      console.log(`Creating collection: ${collectionName}`);

      await qdrantClient.createCollection(collectionName, {
        vectors: {
          size: 384,
          distance: "Cosine",
        },
      });
    } else {
      console.log(`Collection "${collectionName}" already exists.`);
    }
  } catch (err) {
    console.error("Collection creation failed:", err);
  }
}

function getRedisConnection() {
  if (process.env.REDIS_URL) {
    return new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }

  return new IORedis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    maxRetriesPerRequest: null,
  });
}

const redisConnection = getRedisConnection();

const workerOptions: WorkerOptions = {
  concurrency: 10,
  connection: redisConnection,
};

const worker = new Worker<FileJobData>(
  "file-upload-queue",
  async (job) => {
    try {
      console.log(`Processing file: ${job.data.fileId}`);

      const { fileId } = job.data;

      const fileRecord = await db.file.findUnique({
        where: {
          id: fileId,
        },
      });

      if (!fileRecord) {
        throw new Error("File not found");
      }

      const { data: fileBlob, error } =
        await fetch(fileRecord.supabasePath).then(async (res) => {
          if (!res.ok) {
            throw new Error("Supabase file download failed");
          }
          return { data: await res.blob(), error: null };
        });

      if (error || !fileBlob) {
        throw new Error("Supabase file download failed");
      }

      const loader = new PDFLoader(fileBlob);

      const docs = await loader.load();

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
      });

      const chunks = await splitter.splitDocuments(docs);

      const texts = chunks.map((chunk) => chunk.pageContent);

      if (texts.length === 0) {
        throw new Error("No text extracted from PDF");
      }

      console.log(`Generating ${texts.length} embeddings...`);

      const embeddings =
        (await hf.featureExtraction({
          model: "sentence-transformers/all-MiniLM-L6-v2",
          inputs: texts,
        })) as number[][];

      if (!embeddings?.length) {
        throw new Error("Embedding generation failed");
      }

      const points = chunks.map((chunk, index) => ({
        id: uuidv4(),
        vector: embeddings[index] ?? [],
        payload: {
          ...chunk.metadata,
          content: chunk.pageContent,
          fileId,
        },
      }));

      await qdrantClient.upsert(collectionName, {
        points,
      });

      console.log(
        `Stored ${points.length} vectors for file ${fileId}`,
      );
    } catch (err) {
      console.error("Worker processing error:", err);
      throw err;
    }
  },
  workerOptions,
);

export { worker };

ensureCollectionExists()
  .then(() => {
    console.log("Worker is listening for jobs...");
  })
  .catch(console.error);