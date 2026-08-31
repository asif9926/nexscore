"use server";

import { getAdminApp, adminFirestore } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// ১. ফায়ারবেস থেকে সব ম্যাচ হিস্ট্রি নিয়ে আসার ফাংশন
export async function getMatchHistory() {
  try {
    const snapshot = await adminFirestore.collection("matches_history").get();
    
    if (snapshot.empty) {
      return [];
    }

    const matches = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // জাভাস্ক্রিপ্ট ইন-মেমোরি ডিসেন্ডিং সর্ট (যাতে completedAt মিসিং থাকলেও এরর না হয়)
    return matches.sort((a: any, b: any) => {
      const timeA = a.completedAt || a.fullSnapshot?.meta?.updatedAt || 0;
      const timeB = b.completedAt || b.fullSnapshot?.meta?.updatedAt || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching match history:", error);
    return [];
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

    const authAdmin = getAuth(getAdminApp());
    let isVerified = false;

    try {
      await authAdmin.verifyIdToken(token, true);
      isVerified = true;
    } catch {
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