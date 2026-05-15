import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { generateWithGemini, parseJsonResponse } from "@/lib/gemini";
import { createMockStudyResult } from "@/lib/mock-study";
import { buildStudyPrompt } from "@/lib/prompts";
import type { StudyResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type GeminiStudyPayload = Omit<
  StudyResult,
  "documentTitle" | "extractedChars" | "materialText" | "createdAt" | "usedMock"
>;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a PDF file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);
    const materialText = parsed.text.replace(/\s+/g, " ").trim().slice(0, 28000);

    if (materialText.length < 80) {
      return NextResponse.json(
        { error: "Could not extract enough readable text from this PDF" },
        { status: 422 }
      );
    }

    const aiText = await generateWithGemini(buildStudyPrompt(materialText));

    if (!aiText) {
      return NextResponse.json(createMockStudyResult(file.name, materialText));
    }

    const generated = parseJsonResponse<GeminiStudyPayload>(aiText);
    const result: StudyResult = {
  ...generated,
  summary: {
    ...generated.summary,
    formulas: Array.isArray(generated.summary.formulas) 
      ? generated.summary.formulas 
      : typeof generated.summary.formulas === 'string' && generated.summary.formulas !== '-'
        ? [generated.summary.formulas]
        : []
  },
  documentTitle: file.name,
  extractedChars: materialText.length,
  materialText,
  createdAt: new Date().toISOString(),
  usedMock: false
};
    console.log("Gemini raw response:", aiText)
    console.log("Parsed result:", JSON.stringify(generated, null, 2))

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate study pack";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
