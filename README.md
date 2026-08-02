# StudySpark AI

StudySpark AI is a polished AI study assistant MVP for the Google ecosystem. Upload a lecture PDF and generate summaries, quiz questions, flashcards, beginner-friendly explanations, and chat answers using Gemini.

## Features

- PDF upload and server-side text extraction
- Gemini-powered study pack generation
- Summary, exam tips, formulas, quiz, flashcards, and ELI5 explanation
- Chat with uploaded notes
- Demo fallback when `GEMINI_API_KEY` is not configured
- Deployed on Vercel (Cloud Run Dockerfile kept as legacy option)

## Tech Stack

- Next.js
- TailwindCSS
- Gemini API
- Firebase-ready client config
- Vercel deployment

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Gemini key:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3-flash-preview
```

Then open `http://localhost:3000`.

## Firebase Setup

Create a Firebase project, enable Firestore and Storage, then fill the `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`. The current MVP is Firebase-ready; the next step is persisting uploaded PDFs and generated study packs.

## Vercel Deploy (current)

This repo is connected to Vercel. Important: set **Root Directory** to the repo
root (`.`) in Project Settings — not a subfolder.

1. Push to `main`, or run `vercel --prod` from this directory.
2. Set env vars in the Vercel dashboard: `GEMINI_API_KEY`, `GEMINI_MODEL`,
   and the `NEXT_PUBLIC_FIREBASE_*` values from `.env.example`.

Note: Vercel serverless functions cap request bodies at 4.5MB, so PDF uploads
are limited to ~4MB (the app returns a clear error for larger files).

## Cloud Run Deploy (legacy, from the competition)

The Dockerfile still works if GCP billing is re-enabled:

```bash
gcloud run deploy studyspark-ai \
  --source . \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here,GEMINI_MODEL=gemini-3-flash-preview
```

## Demo Flow

1. Upload an Operating Systems PDF.
2. Open the AI Summary tab.
3. Review Quiz and Flashcards.
4. Ask AI Chat: `Explain deadlock like I'm 5.`

## Competition Notes

The MVP focuses on execution, usefulness, deployability, and UX polish. Keep future scope tight: auth, study history, and Firebase persistence are good next additions after the core demo works.
