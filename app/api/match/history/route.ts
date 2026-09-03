// app/api/match/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get("createdBy");

    let query: FirebaseFirestore.Query = adminFirestore.collection("matches_history");

    // 🛡️ ফায়ারস্টোর লিমিট ও মেমোরি ব্লোট প্রতিরোধ
    if (createdBy) {
      query = query.where("createdBy", "==", createdBy).limit(50);
    } else {
      query = query.orderBy("completedAt", "desc").limit(50);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, matches: [] });
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
        cricket: data.fullSnapshot?.cricket || data.cricket || null,
        football: data.fullSnapshot?.football || data.football || null,
      };
    });

    matches.sort((a: any, b: any) => (b.completedAt || 0) - (a.completedAt || 0));

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