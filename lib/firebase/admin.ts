import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;

  // অতিরিক্ত কোটেশন মার্ক সরানো ও \n এস্কেপ ঠিক করা
  let cleanKey = key.trim();
  if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) || (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
    cleanKey = cleanKey.substring(1, cleanKey.length - 1);
  }
  return cleanKey.replace(/\\n/g, "\n");
}

export function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Firebase Admin missing credentials: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

// Lazy Getter Exports (Serverless-safe)
export const adminFirestore = new Proxy({} as ReturnType<typeof getFirestore>, {
  get: (_, prop) => {
    const firestore = getFirestore(getAdminApp());
    return (firestore as any)[prop];
  },
});

export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get: (_, prop) => {
    const auth = getAuth(getAdminApp());
    return (auth as any)[prop];
  },
});

export const adminRtdb = new Proxy({} as ReturnType<typeof getDatabase>, {
  get: (_, prop) => {
    const rtdb = getDatabase(getAdminApp());
    return (rtdb as any)[prop];
  },
});