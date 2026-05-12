import { NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/gemini";
import { buildChatPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      materialText?: string;
    };

    if (!body.question?.trim() || !body.materialText?.trim()) {
      return NextResponse.json(
        { error: "Question and material text are required" },
        { status: 400 }
      );
    }

    const aiText = await generateWithGemini(
      buildChatPrompt(body.materialText.slice(0, 24000), body.question)
    );

    if (!aiText) {
      return NextResponse.json({
        answer:
          "Mode demo aktif karena GEMINI_API_KEY belum dipasang. Setelah API key ditambahkan, chat ini akan menjawab berdasarkan isi PDF kamu."
      });
    }

    return NextResponse.json({ answer: aiText });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to answer question";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
