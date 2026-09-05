// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Next.js hot-reload এ একাধিক ইন্সট্যান্স তৈরি হওয়া ঠেকানোর জন্য
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

// 🛡️ ব্রাউজার রিফ্রেশ বা ফুটার লিঙ্ক ট্রানজিশনে সেশন সুরক্ষার জন্য পারসিস্টেন্স
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Firebase persistence error:", err);
  });
}

export default app;