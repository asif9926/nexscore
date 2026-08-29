"use server";

import { adminFirestore } from "@/lib/firebase/admin";
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

// ২. সুরক্ষিতভাবে ডেটাবেস থেকে ম্যাচ ডিলিট করার ফাংশন (AuthToken Cookie Verified)
export async function deleteMatchAction(id: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("AuthToken")?.value;

    // সেশন কুকি না থাকলে একশন ব্লক করবে
    if (!sessionCookie) {
      console.warn("Delete rejected: Unauthorized request without AuthToken.");
      return { success: false, error: "Unauthorized access" };
    }

    // Firestore থেকে ম্যাচ রেকর্ড ডিলিট
    await adminFirestore.collection("matches_history").doc(id).delete();
    
    // ক্যাশ ক্লিয়ার করে পেজ রিফ্রেশ
    revalidatePath("/admin");
    revalidatePath("/match-history");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting match:", error);
    return { success: false, error: "Failed to delete match record." };
  }
}