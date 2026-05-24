import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support both single message and messages array
    const message =
      body.message ||
      body.messages?.[body.messages.length - 1]?.content ||
      "Hello";

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent(message);

    const response = await result.response;
    const text = response.text();

    console.log("AI Response:", text);

    return NextResponse.json({
      role: "assistant",
      content: text,
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);

    return NextResponse.json(
      {
        role: "assistant",
        content: "Something went wrong.",
      },
      { status: 500 },
    );
  }
}