// app/admin/actions.ts
"use server";

import { adminFirestore, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ১. ফায়ারবেস থেকে লাইটওয়েট ম্যাচ হিস্ট্রি নিয়ে আসার অ্যাকশন
export async function getMatchHistory(): Promise<{ success: boolean; matches: any[]; error?: string }> {
  try {
    const snapshot = await adminFirestore
      .collection("matches_history")
      .orderBy("completedAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return { success: true, matches: [] };
    }

    const matches = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        sport: data.sport || data.meta?.sport || "cricket",
        teamA: data.teamA || data.meta?.teamA || "Team A",
        teamB: data.teamB || data.meta?.teamB || "Team B",
        tournament: data.tournament || data.meta?.tournament || "Tournament Match",
        venue: data.venue || data.meta?.venue || "",
        finalResult: data.finalResult || "Match Completed",
        completedAt: data.completedAt || data.fullSnapshot?.meta?.updatedAt || Date.now(),
      };
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

// ২. সুরক্ষিতভাবে ডেটাবেস থেকে ম্যাচ ডিলিট করার অ্যাকশন
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