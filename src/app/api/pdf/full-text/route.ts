import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/server/db";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 });
    }

    const file = await db.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("files")
      .download(file.supabasePath);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Create a temporary file-like object for PDFLoader
    const blob = new Blob([buffer], { type: "application/pdf" });
    const loader = new PDFLoader(blob);

    // Extract text from PDF
    const docs = await loader.load();

    let fullText = "";
    docs.forEach((doc, index) => {
      const pageNumber = index + 1;
      fullText += `\n\n--- Page ${pageNumber} ---\n\n`;
      fullText += doc.pageContent;
    });

    return NextResponse.json({
      fullText: fullText.trim(),
      pageCount: docs.length,
      fileName: file.name,
    });
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return NextResponse.json(
      { error: "Failed to extract PDF text" },
      { status: 500 }
    );
  }
}
