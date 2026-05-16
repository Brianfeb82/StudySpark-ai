import { NextResponse } from "next/server";
import { generateWithGemini, parseJsonResponse } from "@/lib/gemini";
import { buildPlannerPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

type StudyPlan = {
  totalDays: number;
  dailyGoal: string;
  plan: Array<{
    day: number;
    date: string;
    focus: string;
    tasks: string[];
    duration: string;
  }>;
  tips: string[];
};

export async function POST(request: Request) {
  try {
    const { materialText, examDate, targetScore } = await request.json();

    if (!materialText || !examDate) {
      return NextResponse.json(
        { error: "Material and exam date are required" },
        { status: 400 }
      );
    }

    const aiText = await generateWithGemini(
      buildPlannerPrompt(materialText, examDate, targetScore || "nilai terbaik")
    );

    if (!aiText) {
      return NextResponse.json(
        { error: "Failed to generate study plan" },
        { status: 500 }
      );
    }

    const plan = parseJsonResponse<StudyPlan>(aiText);
    return NextResponse.json(plan);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
