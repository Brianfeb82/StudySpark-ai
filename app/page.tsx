"use client";

import { useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "firebase/storage";
import {
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Flame,
  GraduationCap,
  Loader2,
  MessageSquareText,
  Sparkles,
  Target,
  UploadCloud,
  Zap
} from "lucide-react";
import clsx from "clsx";
import { getFirebaseClient, hasFirebaseConfig } from "@/lib/firebase";
import type { ChatMessage, StudyResult } from "@/lib/types";

const tabs = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "quiz", label: "Quiz", icon: CheckCircle2 },
  { id: "flashcards", label: "Flashcards", icon: BookOpen },
  { id: "chat", label: "AI Chat", icon: MessageSquareText }
] as const;

type TabId = (typeof tabs)[number]["id"];

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

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<StudyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState(
    hasFirebaseConfig() ? "Firebase ready." : "Firebase env not configured yet."
  );
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Upload PDF dulu, lalu tanya bagian materi yang masih bikin macet."
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [examDate, setExamDate] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [examMode, setExamMode] = useState<ExamMode | null>(null);
  const [examModeLoading, setExamModeLoading] = useState(false);

  const progressLabel = useMemo(() => {
    if (loading) return "Extracting PDF and asking Gemini...";
    if (result?.usedMock) return "Demo mode. Add Gemini API key for real AI output.";
    if (result) return "Study pack ready.";
    return "Ready for your lecture PDF.";
  }, [loading, result]);

  async function handleGenerate(selectedFile = file) {
    if (!selectedFile) {
      setError("Choose a PDF first.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/study/generate", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate study pack");
      }

      setResult(payload as StudyResult);
      void persistStudyPack(selectedFile, payload as StudyResult, setSyncStatus);
      setActiveTab("summary");
      setChatMessages([
        {
          role: "assistant",
          content:
            "Study pack sudah siap. Kamu bisa tanya konsep tertentu, minta contoh, atau minta versi ELI5."
        }
      ]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || !result || chatLoading) return;

    const question = chatInput.trim();
    setChatInput("");
    setChatMessages((messages) => [...messages, { role: "user", content: question }]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/study/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          materialText: result.materialText
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Chat failed");
      }

      setChatMessages((messages) => [
        ...messages,
        { role: "assistant", content: payload.answer }
      ]);
    } catch (caught) {
      setChatMessages((messages) => [
        ...messages,
        {
          role: "assistant",
          content: caught instanceof Error ? caught.message : "Aku belum bisa menjawab saat ini."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function generatePlan() {
    if (!result || !examDate) return;
    setPlannerLoading(true);
    try {
      const response = await fetch("/api/study/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialText: result.materialText, examDate, targetScore })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setStudyPlan(payload as StudyPlan);
      setShowPlanner(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to generate plan");
    } finally {
      setPlannerLoading(false);
    }
  }

  async function generateExamMode() {
    if (!result) return;
    setExamModeLoading(true);
    try {
      const response = await fetch("/api/study/exam-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialText: result.materialText })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setExamMode(payload as ExamMode);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to generate exam mode");
    } finally {
      setExamModeLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[0.95fr_1.35fr] lg:px-8">
        <aside className="flex min-h-[calc(100vh-48px)] flex-col justify-between rounded-[8px] border border-line bg-white p-5 shadow-soft">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-spark text-white">
                <Sparkles size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-spark">StudySpark AI</p>
                <h1 className="text-3xl font-bold tracking-normal text-ink sm:text-5xl">
                  Study smarter with AI.
                </h1>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted">
              Upload lecture materials and instantly generate summaries, quizzes,
              flashcards, and simple explanations with Gemini.
            </p>

            {/* How it works */}
            <div className="mt-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">How it works</p>
              <div className="mt-3 space-y-3">
                {[
                  { step: "1", title: "Upload your PDF", desc: "Drop any lecture notes or textbook chapter" },
                  { step: "2", title: "AI generates your study pack", desc: "Summary, quiz, flashcards & ELI5 in seconds" },
                  { step: "3", title: "Study smarter", desc: "Use Study Planner & Exam Mode to ace your exam" }
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-3 items-start">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-spark text-white text-xs font-bold">
                      {step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{title}</p>
                      <p className="text-xs leading-5 text-muted">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { icon: "✨", title: "AI Summary", desc: "Key concepts, formulas & exam tips" },
                { icon: "🧠", title: "Quiz + Flashcards", desc: "Test yourself with AI-generated questions" },
                { icon: "📅", title: "Study Planner", desc: "Day-by-day schedule until exam day" },
                { icon: "⚡", title: "Exam Mode", desc: "Predicted questions & must-know topics" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3 rounded-[8px] border border-line bg-slate-50 p-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{title}</p>
                    <p className="text-xs leading-5 text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badge */}
          <div className="mt-8 rounded-[8px] border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-spark">
              <Flame size={17} />
              Built with Google Ecosystem
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Gemini API", "Firebase", "Cloud Run", "Next.js 15"].map((tech) => (
                <span key={tech} className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-spark">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-5">
          <div className="glass sticky top-4 z-10 rounded-[8px] border border-line p-3 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-emerald-600 text-white">
                  <GraduationCap size={20} />
                </div>
              <div>
                <p className="text-sm font-semibold text-ink">AI Study Dashboard</p>
                <p className="text-sm text-muted">{progressLabel}</p>
                <p className="text-xs text-muted">{syncStatus}</p>
              </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-spark px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <UploadCloud size={18} />
                Upload PDF
              </button>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[270px_1fr]">
            <div className="space-y-5">
              <div className="rounded-[8px] border border-line bg-white p-4 shadow-soft">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0] || null;
                    setFile(selected);
                    if (selected) void handleGenerate(selected);
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-48 w-full flex-col items-center justify-center rounded-[8px] border border-dashed border-blue-300 bg-blue-50 px-4 text-center transition hover:bg-blue-100"
                >
                  <UploadCloud className="text-spark" size={34} />
                  <span className="mt-3 font-semibold text-ink">
                    {file ? file.name : "Drop your lecture PDF"}
                  </span>
                  <span className="mt-1 text-sm leading-6 text-muted">
                    PDF text extraction runs on the server.
                  </span>
                </button>
                <button
                  onClick={() => void handleGenerate()}
                  disabled={!file || loading}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-ink px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Brain size={18} />}
                  Generate Study Pack
                </button>
                {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
                {result && (
                  <button
                    onClick={() => setShowPlanner(true)}
                    className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-spark px-4 text-sm font-semibold text-spark transition hover:bg-blue-50"
                  >
                    <Calendar size={18} />
                    Create Study Plan
                  </button>
                )}
                {result && (
                  <button
                    onClick={() => void generateExamMode()}
                    disabled={examModeLoading}
                    className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border border-amber-400 px-4 text-sm font-semibold text-amber-600 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                  >
                    {examModeLoading 
                      ? <Loader2 className="animate-spin" size={18} /> 
                      : <Zap size={18} />
                    }
                    {examModeLoading ? "Preparing..." : "Exam Mode"}
                  </button>
                )}
              </div>

              <nav className="rounded-[8px] border border-line bg-white p-2 shadow-soft">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        "flex h-11 w-full items-center justify-between rounded-[8px] px-3 text-sm font-semibold transition",
                        activeTab === tab.id
                          ? "bg-blue-50 text-spark"
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={18} />
                        {tab.label}
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="min-h-[620px] rounded-[8px] border border-line bg-white p-5 shadow-soft">
              {!result ? (
                <EmptyState loading={loading} />
              ) : (
                <>
                  <div className="mb-5 flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-spark">{result.documentTitle}</p>
                      <h2 className="text-2xl font-bold text-ink">{currentTitle(activeTab)}</h2>
                    </div>
                    <p className="text-sm text-muted">
                      {result.extractedChars.toLocaleString()} characters extracted
                    </p>
                  </div>

                  {activeTab === "summary" ? <SummaryView result={result} /> : null}
                  {activeTab === "quiz" ? <QuizView result={result} /> : null}
                  {activeTab === "flashcards" ? <FlashcardsView result={result} /> : null}

                  {studyPlan && (
                    <div className="mt-5 rounded-[8px] border border-blue-200 bg-blue-50 p-5">
                      <div className="flex items-center gap-2">
                        <Calendar size={20} className="text-spark" />
                        <h3 className="font-bold text-ink">Study Plan — {studyPlan.totalDays} Hari</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted">{studyPlan.dailyGoal}</p>
                      <div className="mt-4 space-y-3">
                        {studyPlan.plan.map((day) => (
                          <div key={day.day} className="rounded-[8px] border border-line bg-white p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase text-spark">Hari {day.day} · {day.date}</p>
                              <span className="text-xs text-muted">{day.duration}</span>
                            </div>
                            <p className="mt-1 font-semibold text-ink">{day.focus}</p>
                            <ul className="mt-2 space-y-1">
                              {day.tasks.map((task, i) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-700">
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spark" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-[8px] border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm font-semibold text-ink">Tips Belajar</p>
                        <ul className="mt-2 space-y-1">
                          {studyPlan.tips.map((tip, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {examMode && (
                    <div className="mt-5 rounded-[8px] border border-amber-200 bg-amber-50 p-5">
                      <div className="flex items-center gap-2">
                        <Zap size={20} className="text-amber-600" />
                        <h3 className="font-bold text-ink">Exam Mode</h3>
                      </div>

                      {/* Exam Strategy */}
                      <div className="mt-4 rounded-[8px] border border-amber-300 bg-white p-4">
                        <p className="text-sm font-semibold text-ink">📋 Strategi Ujian</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{examMode.examStrategy}</p>
                      </div>

                      {/* Must Know Topics */}
                      <div className="mt-3 rounded-[8px] border border-line bg-white p-4">
                        <p className="text-sm font-semibold text-ink">🔥 Must-Know Topics</p>
                        <ul className="mt-2 space-y-1">
                          {examMode.mustKnowTopics.map((topic, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Predicted Questions */}
                      <div className="mt-3 space-y-3">
                        <p className="text-sm font-semibold text-ink">🎯 Predicted Exam Questions</p>
                        {examMode.predictedQuestions.map((q, i) => (
                          <div key={i} className="rounded-[8px] border border-line bg-white p-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-ink text-sm">{q.question}</p>
                              <span className={clsx(
                                "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                                q.difficulty === "high" 
                                  ? "bg-red-100 text-red-700" 
                                  : q.difficulty === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-green-100 text-green-700"
                              )}>
                                {q.difficulty}
                              </span>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {q.keyPoints.map((point, j) => (
                                <li key={j} className="flex gap-2 text-sm text-slate-600">
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spark" />
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      {/* Quick Revision */}
                      <div className="mt-3 rounded-[8px] border border-line bg-white p-4">
                        <p className="text-sm font-semibold text-ink">⚡ Quick Revision</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {examMode.quickRevision.map((item, i) => (
                            <div key={i} className="rounded-[8px] bg-slate-50 p-3">
                              <p className="text-xs font-semibold text-spark">{item.term}</p>
                              <p className="mt-1 text-sm text-slate-700">{item.definition}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "chat" ? (
                    <ChatView
                      messages={chatMessages}
                      input={chatInput}
                      loading={chatLoading}
                      onInput={setChatInput}
                      onSend={() => void sendChat()}
                    />
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>
      </section>
      {showPlanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[8px] border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-ink">Create Study Plan</h2>
            <p className="mt-1 text-sm text-muted">Gemini akan buatkan jadwal belajar harian kamu</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-ink">Tanggal Ujian</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="mt-1 w-full rounded-[8px] border border-line px-3 py-2 text-sm outline-none ring-spark/20 focus:ring-4"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Target Nilai (opsional)</label>
                <input
                  type="text"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="contoh: 90, A, lulus dengan baik"
                  className="mt-1 w-full rounded-[8px] border border-line px-3 py-2 text-sm outline-none ring-spark/20 focus:ring-4"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowPlanner(false)}
                className="flex-1 rounded-[8px] border border-line px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => void generatePlan()}
                disabled={!examDate || plannerLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-[8px] bg-spark px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300"
              >
                {plannerLoading ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />}
                Generate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

async function persistStudyPack(
  file: File,
  result: StudyResult,
  setSyncStatus: (status: string) => void
) {
  const firebase = getFirebaseClient();

  if (!firebase) {
    setSyncStatus("Firebase env not configured yet.");
    return;
  }

  try {
    setSyncStatus("Saving to Firebase...");
    const filePath = `documents/${Date.now()}-${file.name}`;
    const fileRef = ref(firebase.storage, filePath);
    await uploadBytes(fileRef, file, {
      contentType: "application/pdf"
    });
    const fileUrl = await getDownloadURL(fileRef);

    await addDoc(collection(firebase.db, "studyPacks"), {
      documentTitle: result.documentTitle,
      extractedChars: result.extractedChars,
      summary: result.summary,
      quiz: result.quiz,
      flashcards: result.flashcards,
      eli5: result.eli5,
      usedMock: result.usedMock,
      fileUrl,
      filePath,
      createdAt: serverTimestamp()
    });

    setSyncStatus("Saved to Firebase Storage and Firestore.");
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Firebase save failed";
    setSyncStatus(`Firebase save skipped: ${message}`);
  }
}

function currentTitle(tab: TabId) {
  if (tab === "summary") return "AI Summary";
  if (tab === "quiz") return "Quiz Generator";
  if (tab === "flashcards") return "Flashcards";
  return "Chat With Notes";
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[8px] bg-blue-50 text-spark">
        {loading ? <Loader2 className="animate-spin" size={28} /> : <Sparkles size={28} />}
      </div>
      <h2 className="mt-4 text-2xl font-bold text-ink">
        {loading ? "Building your study pack" : "Upload notes to begin"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        Summary, quiz, flashcards, ELI5 explanation, and chat will appear here after the PDF is processed.
      </p>
    </div>
  );
}

function SummaryView({ result }: { result: StudyResult }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Key Concepts" items={result.summary.keyConcepts} />
      <Panel title="Exam Tips" items={result.summary.examTips} />
      <div className="rounded-[8px] border border-line bg-slate-50 p-4 lg:col-span-2">
        <p className="font-semibold text-ink">Simple Explanation</p>
        <p className="mt-2 leading-7 text-slate-700">{result.summary.simpleExplanation}</p>
      </div>
      <Panel title="Important Formulas" items={result.summary.formulas} />
      <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-4">
        <p className="font-semibold text-ink">Explain Like I&apos;m 5</p>
        <p className="mt-2 leading-7 text-slate-700">{result.eli5}</p>
      </div>
      <div className="lg:col-span-2">
        <DifficultyBadge quiz={result.quiz} />
      </div>
    </div>
  );
}

function DifficultyBadge({ quiz }: { quiz: StudyResult["quiz"] }) {
  const easy = quiz.filter((q) => q.difficulty === "easy").length;
  const medium = quiz.filter((q) => q.difficulty === "medium").length;
  const hard = quiz.filter((q) => q.difficulty === "hard").length;
  const total = quiz.length;

  const hardTopics = quiz
    .filter((q) => q.difficulty === "hard")
    .map((q) => q.question);

  return (
    <div className="rounded-[8px] border border-line bg-white p-4">
      <p className="text-sm font-semibold text-ink">🧠 Topic Difficulty Analysis</p>
      
      <div className="mt-3 flex gap-2">
        <div className="flex-1 rounded-[8px] bg-green-50 border border-green-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{easy}</p>
          <p className="text-xs text-green-600 font-semibold">Easy</p>
        </div>
        <div className="flex-1 rounded-[8px] bg-amber-50 border border-amber-200 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{medium}</p>
          <p className="text-xs text-amber-600 font-semibold">Medium</p>
        </div>
        <div className="flex-1 rounded-[8px] bg-red-50 border border-red-200 p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{hard}</p>
          <p className="text-xs text-red-600 font-semibold">Hard</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
        <div 
          className="h-full bg-green-400 transition-all"
          style={{ width: `${(easy/total)*100}%` }}
        />
        <div 
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${(medium/total)*100}%` }}
        />
        <div 
          className="h-full bg-red-400 transition-all"
          style={{ width: `${(hard/total)*100}%` }}
        />
      </div>

      {hardTopics.length > 0 && (
        <div className="mt-3 rounded-[8px] bg-red-50 border border-red-100 p-3">
          <p className="text-xs font-semibold text-red-700">🔴 Focus on these hard topics:</p>
          <ul className="mt-1 space-y-1">
            {hardTopics.map((topic, i) => (
              <li key={i} className="text-xs text-red-600 leading-5">• {topic}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[8px] border border-line bg-slate-50 p-4">
      <p className="font-semibold text-ink">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spark" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuizView({ result }: { result: StudyResult }) {
  return (
    <div className="space-y-4">
      {result.quiz.map((item, index) => (
        <details
          key={`${item.question}-${index}`}
          className="rounded-[8px] border border-line bg-slate-50 p-4"
        >
          <summary className="cursor-pointer list-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-spark">
                  Question {index + 1} · {item.difficulty}
                </p>
                <h3 className="mt-1 font-semibold text-ink">{item.question}</h3>
              </div>
              <ChevronRight className="mt-1 shrink-0 text-muted" size={18} />
            </div>
          </summary>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {item.options.map((option) => (
              <div key={option} className="rounded-[8px] border border-line bg-white p-3 text-sm">
                {option}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-[8px] border border-emerald-200 bg-emerald-50 p-3 text-sm leading-6">
            <p className="font-semibold text-emerald-800">Answer: {item.answer}</p>
            <p className="mt-1 text-emerald-900">{item.explanation}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

function FlashcardsView({ result }: { result: StudyResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {result.flashcards.map((card, index) => (
        <div
          key={`${card.question}-${index}`}
          className="min-h-44 rounded-[8px] border border-line bg-slate-50 p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-normal text-spark">
            Flashcard {index + 1}
          </p>
          <h3 className="mt-2 font-semibold leading-6 text-ink">{card.question}</h3>
          <div className="mt-4 rounded-[8px] bg-white p-3 text-sm leading-6 text-slate-700">
            {card.answer}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatView({
  messages,
  input,
  loading,
  onInput,
  onSend
}: {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  onInput: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="flex min-h-[540px] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-[8px] bg-slate-50 p-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={clsx(
              "max-w-[86%] rounded-[8px] p-3 text-sm leading-6",
              message.role === "user"
                ? "ml-auto bg-spark text-white"
                : "border border-line bg-white text-slate-700"
            )}
          >
            {message.content}
          </div>
        ))}
        {loading ? (
          <div className="inline-flex items-center gap-2 rounded-[8px] border border-line bg-white p-3 text-sm text-muted">
            <Loader2 className="animate-spin" size={16} />
            Thinking...
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(event) => onInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Ask: Explain deadlock like I'm 5"
          className="min-h-12 flex-1 resize-none rounded-[8px] border border-line bg-white px-3 py-3 text-sm outline-none ring-spark/20 transition focus:ring-4"
        />
        <button
          onClick={onSend}
          disabled={!input.trim() || loading}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-spark text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          aria-label="Send message"
          title="Send message"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
