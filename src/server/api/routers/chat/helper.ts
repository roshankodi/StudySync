import { v4 as uuidv4 } from "uuid";
import { db } from "@/server/db";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

export async function uploadToSupabase(
  file: File,
  userId: string,
) {
  try {
    if (!userId) {
      throw new Error("User ID missing");
    }

    const fileId = uuidv4();

    const filePath = `${userId}/${fileId}-${file.name}`;

    const { data, error } = await getSupabase().storage
      .from("documents")
      .upload(filePath, file, {
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload failed:", error);
      throw error;
    }

    const createdFile = await db.file.create({
      data: {
        id: fileId,
        userId: userId,
        name: file.name,
        size: file.size,
        fileType: file.type,
        supabasePath: filePath,

        // required Prisma field
        supabaseFileId: data.path,
      },
    });

    return createdFile;
  } catch (err) {
    console.error("uploadToSupabase error:", err);
    throw err;
  }
}