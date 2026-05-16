import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyCSrfgHFAMKeA7nhAjDEaEVZw89XhW582Q",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "studyspark-ai-1490b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "studyspark-ai-1490b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "studyspark-ai-1490b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "694784171804",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:694784171804:web:a1d3c8d305f2d9f1d0e4d9"
};

export function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(Boolean);
}

export function getFirebaseClient() {
  if (!hasFirebaseConfig()) {
    return null;
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  return {
    app,
    db: getFirestore(app),
    storage: getStorage(app)
  };
}
