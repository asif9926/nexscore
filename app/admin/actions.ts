"use server";

import { adminFirestore, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ১. ফায়ারবেস থেকে সব ম্যাচ হিস্ট্রি নিয়ে আসার ফাংশন
export async function getMatchHistory(): Promise<{ success: boolean; matches: any[]; error?: string }> {
  try {
    const snapshot = await adminFirestore.collection("matches_history").get();

    if (snapshot.empty) {
      return { success: true, matches: [] };
    }

    const matches = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    matches.sort((a: any, b: any) => {
      const timeA = a.completedAt || a.fullSnapshot?.meta?.updatedAt || 0;
      const timeB = b.completedAt || b.fullSnapshot?.meta?.updatedAt || 0;
      return timeB - timeA;
    });

    return { success: true, matches };
  } catch (error: any) {
    console.error("CRITICAL Firestore getMatchHistory error:", error);
    return { 
      success: false, 
      matches: [], 
      error: error?.message || "Firestore connection failed. Check Vercel environment variables." 
    };
  }
}

// ২. সুরক্ষিতভাবে ডেটাবেস থেকে ম্যাচ ডিলিট করার ফাংশন
export async function deleteMatchAction(id: string, clientToken?: string) {
  try {
    const cookieStore = await cookies();
    const token = clientToken || cookieStore.get("AuthToken")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized access: Session token missing." };
    }

    let isVerified = false;

    try {
      await adminAuth.verifyIdToken(token, true);
      isVerified = true;
    } catch {
      try {
        await adminAuth.verifySessionCookie(token, true);
        isVerified = true;
      } catch {
        isVerified = false;
      }
    }

    if (!isVerified) {
      return { success: false, error: "Invalid or expired session. Please log in again." };
    }

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