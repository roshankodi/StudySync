import { v4 as uuidv4 } from "uuid";
import { db } from "@/server/db";
import { getSupabase } from "@/lib/supabase";

export async function uploadToSupabase(
  file: File,
  userId: string
) {
  try {
    if (!userId) {
      throw new Error("User ID missing");
    }

    const supabase = getSupabase();

    const fileId = uuidv4();

    const filePath = `${userId}/${fileId}-${file.name}`;

    console.log("Uploading to:", filePath);

    const { data, error } =
      await supabase.storage
        .from("documents")
        .upload(filePath, file, {
          upsert: true,
        });

    console.log("Upload result:", data);
    console.log("Upload error:", error);

    if (error) {
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
        supabaseFileId: data.path,
      },
    });

    return createdFile;

  } catch (err) {
    console.error(
      "uploadToSupabase error:",
      err
    );

    throw err;
  }
}