import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { generateWithGemini, parseJsonResponse } from "@/lib/gemini";
import { createMockStudyResult } from "@/lib/mock-study";
import { buildStudyPrompt } from "@/lib/prompts";
import type { StudyResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel serverless rejects request bodies above 4.5MB before they reach
// this code, so fail early with a clear message instead of an opaque 413.
const MAX_PDF_SIZE = 4 * 1024 * 1024;

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

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: "PDF terlalu besar untuk versi demo (maks 4MB). Coba file yang lebih kecil." },
        { status: 413 }
      );
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

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate study pack";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
