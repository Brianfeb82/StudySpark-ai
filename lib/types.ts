export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};

export type Flashcard = {
  question: string;
  answer: string;
};

export type StudyResult = {
  documentTitle: string;
  extractedChars: number;
  summary: {
    keyConcepts: string[];
    simpleExplanation: string;
    formulas: string[];
    examTips: string[];
  };
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
  eli5: string;
  materialText: string;
  createdAt: string;
  usedMock: boolean;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
