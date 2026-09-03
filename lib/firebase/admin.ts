// lib/firebase/admin.ts
import { initializeApp, getApps, cert, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import { getDatabase, Database } from "firebase-admin/database";

function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;

  let cleanKey = key.trim();
  if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) || (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
    cleanKey = cleanKey.substring(1, cleanKey.length - 1);
  }
  return cleanKey.replace(/\\n/g, "\n");
}

let adminAppInstance: App | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let rtdbInstance: Database | null = null;

export function getAdminApp(): App {
  if (adminAppInstance) return adminAppInstance;

  if (getApps().length > 0) {
    adminAppInstance = getApp();
    return adminAppInstance;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      `Firebase Admin missing credentials: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`
    );
  }

  adminAppInstance = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  return adminAppInstance;
}

export function getAdminFirestore(): Firestore {
  if (!firestoreInstance) {
    firestoreInstance = getFirestore(getAdminApp());
  }
  return firestoreInstance;
}

export function getAdminAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getAdminApp());
  }
  return authInstance;
}

export function getAdminRtdb(): Database {
  if (!rtdbInstance) {
    rtdbInstance = getDatabase(getAdminApp());
  }
  return rtdbInstance;
}

// 🔒 আইসোলেটেড লেজি প্রক্সি + `this` Context মেথড বাইন্ডিং (Zero-Crash Guarantee)
export const adminFirestore = new Proxy({} as Firestore, {
  get: (_, prop: string | symbol) => {
    const instance = getAdminFirestore();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get: (_, prop: string | symbol) => {
    const instance = getAdminAuth();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const adminRtdb = new Proxy({} as Database, {
  get: (_, prop: string | symbol) => {
    const instance = getAdminRtdb();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});