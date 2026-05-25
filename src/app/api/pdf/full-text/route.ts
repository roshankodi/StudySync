import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/server/db";

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL missing");
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY missing");

  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    const file = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const { data: fileData, error: downloadError } =
      await getSupabase().storage
        .from("documents")
        .download(file.supabasePath);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(
      await fileData.arrayBuffer()
    );

    const blob = new Blob(
      [buffer],
      { type: "application/pdf" }
    );

    const loader = new PDFLoader(blob);

    const docs = await loader.load();

    let fullText = "";

    docs.forEach((doc, index) => {
      fullText += `\n\n--- Page ${index + 1} ---\n\n`;
      fullText += doc.pageContent;
    });

    return NextResponse.json({
      fullText: fullText.trim(),
      pageCount: docs.length,
      fileName: file.name,
    });

  } catch (error) {
    console.error(
      "Error extracting PDF text:",
      error
    );

    return NextResponse.json(
      { error: "Failed to extract PDF text" },
      { status: 500 }
    );
  }
}