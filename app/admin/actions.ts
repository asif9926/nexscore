// app/admin/actions.ts
"use server";

import { adminFirestore, adminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getMatchHistory(createdBy?: string): Promise<{ success: boolean; matches: any[]; error?: string }> {
  try {
    let snapshot;
    if (createdBy) {
      snapshot = await adminFirestore
        .collection("matches_history")
        .where("createdBy", "==", createdBy)
        .limit(50)
        .get();
    } else {
      snapshot = await adminFirestore
        .collection("matches_history")
        .orderBy("completedAt", "desc")
        .limit(50)
        .get();
    }

    if (snapshot.empty) {
      return { success: true, matches: [] };
    }

    const matches = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        sport: data.sport || data.meta?.sport || "cricket",
        createdBy: data.createdBy || data.fullSnapshot?.meta?.createdBy || null,
        teamA: data.teamA || data.meta?.teamA || "Team A",
        teamB: data.teamB || data.meta?.teamB || "Team B",
        tournament: data.tournament || data.meta?.tournament || "Tournament Match",
        venue: data.venue || data.meta?.venue || "",
        finalResult: data.finalResult || "Match Completed",
        completedAt: data.completedAt || data.fullSnapshot?.meta?.updatedAt || Date.now(),
      };
    });

    matches.sort((a: any, b: any) => (b.completedAt || 0) - (a.completedAt || 0));

    return { success: true, matches };
  } catch (error: any) {
    console.error("Firestore getMatchHistory error:", error);
    return { 
      success: false, 
      matches: [], 
      error: error?.message || "Firestore connection failed." 
    };
  }
}

export async function deleteMatchAction(id: string, clientToken?: string) {
  try {
    const cookieStore = await cookies();
    const token = clientToken || cookieStore.get("AuthToken")?.value;

    if (!token) {
      return { success: false, error: "Unauthorized: Session token missing." };
    }

    let adminUid: string | null = null;

    try {
      const decoded = await adminAuth.verifyIdToken(token, true);
      adminUid = decoded.uid;
    } catch {
      try {
        const decoded = await adminAuth.verifySessionCookie(token, true);
        adminUid = decoded.uid;
      } catch {
        adminUid = null;
      }
    }

    if (!adminUid) {
      return { success: false, error: "Invalid or expired session." };
    }

    const docRef = adminFirestore.collection("matches_history").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: "Match record not found." };
    }

    const docData = docSnap.data();
    const matchCreator = docData?.createdBy || docData?.fullSnapshot?.meta?.createdBy;

    // ওনারশিপ এনফোর্সমেন্ট
    if (matchCreator && matchCreator !== adminUid) {
      return { success: false, error: "Forbidden: You cannot delete matches created by other admins." };
    }

    await docRef.delete();

    revalidatePath("/admin");
    revalidatePath("/match-history");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting match:", error);
    return { success: false, error: error?.message || "Failed to delete match record." };
  }
}