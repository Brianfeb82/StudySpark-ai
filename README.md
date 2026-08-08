# StudySpark AI

StudySpark AI is an AI study assistant for the Google ecosystem, deployed on Vercel. Upload a lecture PDF and generate summaries, quiz questions, flashcards, beginner-friendly explanations, a day-by-day study planner, predicted exam questions, and chat answers using Gemini.

## Features

- PDF upload and server-side text extraction with a friendly error for damaged/corrupted PDFs (bad XRef)
- Gemini-powered study pack generation
- Summary, exam tips, formulas, quiz, flashcards, and ELI5 explanation
- Chat with uploaded notes
- Study Planner (day-by-day schedule until exam day)
- Exam Mode (predicted questions, must-know topics, quick revision)
- Study history: every pack is saved to Firestore and can be reopened from the History tab; the PDF is uploaded to Storage best-effort
- Drag & drop upload, dark mode toggle (persisted), Inter font, scroll/click animations
- Demo fallback when `GEMINI_API_KEY` is not configured

## Tech Stack

- Next.js 15 (App Router)
- TailwindCSS
- Gemini API
- Firebase (Firestore + Storage, client-side), free tier
- Vercel deployment

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your keys in `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3-flash-preview

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Then open `http://localhost:3000`.

## Firebase Setup

Create a Firebase project, enable Firestore and Storage, then set the
`NEXT_PUBLIC_FIREBASE_*` variables. Without them the app runs but shows a
"Firebase env not configured yet." state and skips history saving.

Note: the project lives on the free (Spark) plan. If the Storage bucket hits its
quota, PDF uploads are skipped but the study pack is still saved to Firestore
history — the UI shows an amber "kept on this device" badge. Free the quota via
Firebase Console → Storage → delete files under `documents/`, or run the helper
script (see [Storage cleanup](#storage-cleanup)).

## Storage cleanup

```bash
gcloud auth application-default login   # or export GOOGLE_APPLICATION_CREDENTIALS
node scripts/empty-storage.mjs          # dry run, lists objects
node scripts/empty-storage.mjs --force  # delete everything in the bucket
```

## Vercel Deploy (current)

Push to `main`, or run `vercel --prod` from this directory. Set the env vars
from `.env.example` in the Vercel dashboard.

Note: Vercel serverless functions cap request bodies at about 4.5MB, so PDF
uploads are limited to ~4MB (the app returns a clear error for larger files).

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

1. Upload a lecture PDF (drag & drop works).
2. Review the AI Summary, Quiz, and Flashcards tabs.
3. Ask AI Chat: `Explain deadlock like I'm 5`.
4. Try the Study Planner and Exam Mode.
5. Reopen any saved pack from the History tab.