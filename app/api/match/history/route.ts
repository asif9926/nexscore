// app/api/match/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get("createdBy");

    let query: FirebaseFirestore.Query = adminFirestore.collection("matches_history");

    if (createdBy) {
      query = query.where("createdBy", "==", createdBy).limit(50);
    } else {
      query = query.orderBy("completedAt", "desc").limit(50);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, matches: [] });
    }

    // 🛡️ Vercel 4.5MB লিমিট রক্ষা: বল-বাই-বল কমেন্ট্রি বাদ দিয়ে শুধু মেটাডাটা ও স্কোর পাঠানো
    const matches = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const cricketSnap = data.fullSnapshot?.cricket || data.cricket;
      const footballSnap = data.fullSnapshot?.football || data.football;

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
        cricket: cricketSnap
          ? {
              innings1: cricketSnap.innings1 ? { score: cricketSnap.innings1.score, wickets: cricketSnap.innings1.wickets, overs: cricketSnap.innings1.overs } : null,
              innings2: cricketSnap.innings2 ? { score: cricketSnap.innings2.score, wickets: cricketSnap.innings2.wickets, overs: cricketSnap.innings2.overs } : null,
            }
          : null,
        football: footballSnap
          ? {
              scoreA: footballSnap.scoreA ?? 0,
              scoreB: footballSnap.scoreB ?? 0,
            }
          : null,
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