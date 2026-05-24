import { Queue } from "bullmq";
import IORedis from "ioredis";
import { v4 as uuidv4 } from "uuid";

import { supabase } from "@/lib/supabase";
import { db } from "@/server/db";

const redis = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      maxRetriesPerRequest: null,
    });

export const uploadQueue = new Queue(
  "file-upload-queue",
  {
    connection: redis,
  }
);

export async function uploadToSupabase(
  file: File,
  userId: string,
) {
  try {
    const fileId = uuidv4();

    const filePath = `${userId}/${fileId}-${file.name}`;

    const { error } = await supabase.storage
      .from("documents") // IMPORTANT: your actual bucket
      .upload(filePath, file);

    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }

    const createdFile = await db.file.create({
      data: {
        id: fileId,
        userId,
        name: file.name,
        size: file.size,
        fileType: file.type,
        supabasePath: filePath,
      },
    });

    await uploadQueue.add(
      "process-file",
      {
        fileId: createdFile.id,
      }
    );

    return createdFile;
  } catch (err) {
    console.error("uploadToSupabase error:", err);
    throw err;
  }
}