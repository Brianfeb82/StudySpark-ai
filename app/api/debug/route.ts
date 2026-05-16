export async function GET() {
  return Response.json({
    hasFirebaseKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    firebaseKeyPrefix: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.slice(0, 10)
  });
}
