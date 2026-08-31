import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await adminFirestore.collection("matches_history").get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, matches: [] });
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

    return NextResponse.json({ success: true, matches });
  } catch (error: any) {
    console.error("Firestore getMatchHistory Error:", error);
    return NextResponse.json(
      {
        success: false,
        matches: [],
        error: error?.message || "Failed to load archived matches from Firestore.",
      },
      { status: 500 }
    );
  }
}