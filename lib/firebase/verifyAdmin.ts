// lib/firebase/verifyAdmin.ts
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getAdminApp } from "./admin";

/**
 * যেকোনো state-mutating API route-এ (যেমন /api/match/finalize) কল করার জন্য।
 *
 * middleware.ts শুধু "/admin/*" পাথ প্রোটেক্ট করে — "/api/*" রুটগুলো middleware-এ
 * matched হলেও invalid/missing token থাকলে চুপচাপ পাস হয়ে যায় (দেখো
 * middleware.ts-এর handleInvalidToken/handleError, দুটোই শুধু pathname.startsWith('/admin')
 * চেক করে)। তাই যেকোনো admin-only API route-কে নিজে থেকেই caller ভেরিফাই করতে হবে —
 * middleware-এর উপর ভরসা করা যাবে না।
 *
 * দুই ধাপে ভেরিফাই করে:
 *   ১. Authorization: Bearer <idToken> হেডার থেকে Firebase ID token টা আসলেই ভ্যালিড কিনা
 *      (Admin SDK দিয়ে verify — expired/forged/tampered টোকেন এখানেই বাদ পড়বে)।
 *   ২. সেই uid-টা RTDB-র /admins নোডে আছে কিনা — এটা firebase.rtdb.rules.json-এর
 *      write rule-এর সাথে ঠিক একই authorization মডেল, যাতে "লগইন করা যেকোনো
 *      Firebase user" আর "প্রকৃত admin" এর মধ্যে গ্যাপ না থাকে।
 *
 * রিটার্ন করে { uid } ভ্যালিড admin হলে, নাহলে null।
 */
export async function verifyAdminRequest(
  request: Request
): Promise<{ uid: string } | null> {
  const authHeader =
    request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) return null;

  try {
    const app = getAdminApp();

    // ১. টোকেন verify — expired/revoked হলে এখানেই throw করবে
    const decoded = await getAuth(app).verifyIdToken(idToken, true /* checkRevoked */);

    // ২. RTDB rules-এর সাথে সামঞ্জস্যপূর্ণ admin-membership চেক
    const rtdb = getDatabase(app);
    const adminSnap = await rtdb.ref(`admins/${decoded.uid}`).get();

    if (!adminSnap.exists()) {
      console.warn(`Rejected /admins check for uid: ${decoded.uid}`);
      return null;
    }

    return { uid: decoded.uid };
  } catch (error) {
    console.error("verifyAdminRequest failed:", error);
    return null;
  }
}
