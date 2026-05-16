import { NextResponse } from "next/server";
import { generateWithGemini, parseJsonResponse } from "@/lib/gemini";
import { buildExamModePrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExamMode = {
  predictedQuestions: Array<{
    question: string;
    keyPoints: string[];
    difficulty: string;
  }>;
  mustKnowTopics: string[];
  quickRevision: Array<{
    term: string;
    definition: string;
  }>;
  examStrategy: string;
};

export async function POST(request: Request) {
  try {
    const { materialText } = await request.json();

    if (!materialText) {
      return NextResponse.json(
        { error: "Material is required" },
        { status: 400 }
      );
    }

    const aiText = await generateWithGemini(buildExamModePrompt(materialText));

    if (!aiText) {
      return NextResponse.json(
        { error: "Failed to generate exam mode" },
        { status: 500 }
      );
    }

    const examMode = parseJsonResponse<ExamMode>(aiText);
    return NextResponse.json(examMode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate exam mode";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
