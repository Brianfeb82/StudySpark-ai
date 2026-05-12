import type { StudyResult } from "@/lib/types";

export function createMockStudyResult(title: string, materialText: string): StudyResult {
  return {
    documentTitle: title,
    extractedChars: materialText.length,
    createdAt: new Date().toISOString(),
    usedMock: true,
    materialText,
    summary: {
      keyConcepts: [
        "Materi dipetakan menjadi konsep utama agar mudah dipelajari ulang.",
        "Setiap konsep penting disambungkan dengan contoh sederhana.",
        "Bagian yang sering keluar ujian diprioritaskan untuk latihan."
      ],
      simpleExplanation:
        "StudySpark sudah membaca file kamu. Tambahkan GEMINI_API_KEY agar rangkuman ini diganti dengan hasil AI asli dari Gemini berdasarkan isi PDF.",
      formulas: ["Aktifkan Gemini untuk mengekstrak rumus penting otomatis."],
      examTips: [
        "Baca key concepts dulu sebelum mengerjakan quiz.",
        "Gunakan flashcards untuk review cepat 10 menit.",
        "Tanyakan bagian sulit lewat AI Chat."
      ]
    },
    quiz: [
      {
        question: "Apa tujuan utama StudySpark AI?",
        options: [
          "A. Mengubah materi menjadi alat belajar",
          "B. Menghapus semua catatan",
          "C. Membuat game multiplayer",
          "D. Mengganti dosen"
        ],
        answer: "A. Mengubah materi menjadi alat belajar",
        explanation: "Aplikasi ini membantu membuat summary, quiz, flashcards, dan penjelasan sederhana.",
        difficulty: "easy"
      },
      {
        question: "Fitur mana yang paling cocok untuk latihan sebelum ujian?",
        options: ["A. Quiz", "B. Billing", "C. Theme switcher", "D. Deploy log"],
        answer: "A. Quiz",
        explanation: "Quiz membantu menguji pemahaman secara aktif.",
        difficulty: "easy"
      },
      {
        question: "Apa fungsi Explain Like I'm 5?",
        options: [
          "A. Menjelaskan konsep sulit dengan bahasa sederhana",
          "B. Mengubah PDF menjadi video",
          "C. Membuat akun Firebase",
          "D. Menjalankan Cloud Run"
        ],
        answer: "A. Menjelaskan konsep sulit dengan bahasa sederhana",
        explanation: "ELI5 membuat topik rumit terasa lebih dekat untuk pemula.",
        difficulty: "medium"
      }
    ],
    flashcards: [
      {
        question: "Apa itu active recall?",
        answer: "Belajar dengan mencoba mengingat jawaban sebelum melihat materi."
      },
      {
        question: "Kenapa flashcards berguna?",
        answer: "Flashcards membuat review cepat dan terarah."
      },
      {
        question: "Kapan memakai AI Chat?",
        answer: "Saat ada konsep di catatan yang masih membingungkan."
      }
    ],
    eli5:
      "Bayangkan materi kuliah seperti kamar berantakan. StudySpark membantu merapikan barangnya: yang penting jadi rangkuman, yang perlu dilatih jadi quiz, dan yang harus diingat jadi flashcards."
  };
}
