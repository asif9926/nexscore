// lib/firebase/verifyAdmin.ts
import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "./admin";

export async function verifyAdminRequest(
  request: Request
): Promise<{ uid: string; email?: string } | null> {
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) return null;

  try {
    const app = getAdminApp();

    // ১. Firebase Admin SDK দিয়ে টোকেন সম্পূর্ণ ভেরিফাই করা (Expired/Tampered টোকেন ব্লক হবে)
    const decoded = await getAuth(app).verifyIdToken(idToken, true /* checkRevoked */);

    if (!decoded.uid) {
      return null;
    }

    return { 
      uid: decoded.uid,
      email: decoded.email 
    };
  } catch (error) {
    console.error("verifyAdminRequest authorization failed:", error);
    return null;
  }
}