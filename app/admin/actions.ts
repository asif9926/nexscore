"use server";

import { getAdminApp, adminFirestore } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ১. ফায়ারবেস থেকে সব ম্যাচ হিস্ট্রি নিয়ে আসার ফাংশন
export async function getMatchHistory() {
  try {
    const snapshot = await adminFirestore
      .collection("matches_history")
      .orderBy("completedAt", "desc")
      .get();
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching match history:", error);
    return [];
  }
}

// ২. সুরক্ষিতভাবে ডেটাবেস থেকে ম্যাচ ডিলিট করার ফাংশন (Direct ID Token + Session Cookie Verification)
export async function deleteMatchAction(id: string, clientToken?: string) {
  try {
    const cookieStore = await cookies();
    const token = clientToken || cookieStore.get("AuthToken")?.value;

    if (!token) {
      console.warn("Delete match rejected: No token found.");
      return { success: false, error: "Unauthorized access: Session token missing." };
    }

    const authAdmin = getAuth(getAdminApp());
    let isVerified = false;

    // ১. ক্লায়েন্ট আইডি টোকেন যাচাই (সবচেয়ে নির্ভরযোগ্য)
    try {
      await authAdmin.verifyIdToken(token, true);
      isVerified = true;
    } catch {
      // ২. সেশন কুকি হিসেবে ফলব্যাক যাচাই
      try {
        await authAdmin.verifySessionCookie(token, true);
        isVerified = true;
      } catch {
        isVerified = false;
      }
    }

    if (!isVerified) {
      return { success: false, error: "Invalid or expired session. Please log in again." };
    }

    // Firestore থেকে ম্যাচ রেকর্ড ডিলিট
    await adminFirestore.collection("matches_history").doc(id).delete();
    
    revalidatePath("/admin");
    revalidatePath("/match-history");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting match:", error);
    return { success: false, error: error?.message || "Failed to delete match record." };
  }
}