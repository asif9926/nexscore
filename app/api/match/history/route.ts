// app/api/match/history/route.ts
import { NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await adminFirestore
      .collection("matches_history")
      .orderBy("completedAt", "desc")
      .limit(50)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, matches: [] });
    }

    // শুধুমাত্র কার্ড রেন্ডারিংয়ের জন্য লাইটওয়েট অবজেক্ট ম্যাপ করা হয়েছে
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
        cricket: data.fullSnapshot?.cricket || data.cricket || null,
        football: data.fullSnapshot?.football || data.football || null,
      };
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