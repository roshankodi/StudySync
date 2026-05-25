import { NextRequest, NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { db } from "@/server/db";
import { supabase, STORAGE_BUCKET } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const fileId = searchParams.get("fileId");

    console.log("fileId:", fileId);

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing fileId" },
        { status: 400 }
      );
    }

    const file = await db.file.findUnique({
      where: { id: fileId }
    });

    console.log("DB file:", file);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    console.log(
      "Downloading:",
      file.supabasePath
    );

    const { data, error } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .download(file.supabasePath);

    console.log(
      "Download error:",
      error
    );

    if (error || !data) {
      return NextResponse.json(
        {
          error: "Failed downloading PDF",
          details: error
        },
        { status: 500 }
      );
    }

    const blob = new Blob(
      [await data.arrayBuffer()],
      {
        type: "application/pdf"
      }
    );

    const loader = new PDFLoader(blob);

    const docs = await loader.load();

    const fullText = docs
      .map(
        (doc, i) =>
          `--- Page ${i + 1} ---\n${doc.pageContent}`
      )
      .join("\n\n");

    return NextResponse.json({
      fullText,
      pageCount: docs.length,
      fileName: file.name
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "PDF extraction failed"
      },
      { status: 500 }
    );
  }
}