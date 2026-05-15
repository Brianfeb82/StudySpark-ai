import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudySpark AI",
  description: "AI study assistant for lecture notes, quizzes, flashcards, and simple explanations."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
