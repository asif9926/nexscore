"use server";

import { adminFirestore, getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ১. ফায়ারবেস থেকে ম্যাচ হিস্ট্রি নিয়ে আসার ফাংশন
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

// ২. সুরক্ষিতভাবে ডেটাবেস থেকে ম্যাচ ডিলিট করার ফাংশন (Auth Protected)
export async function deleteMatchAction(id: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("AuthToken")?.value;

    if (!sessionCookie) {
      throw new Error("Unauthorized");
    }

    const authAdmin = getAuth(getAdminApp());
    await authAdmin.verifySessionCookie(sessionCookie, true);

    await adminFirestore.collection("matches_history").doc(id).delete();
    
    revalidatePath("/admin");
    revalidatePath("/match-history");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting match:", error);
    return { success: false, error: "Unauthorized or failed to delete" };
  }
}