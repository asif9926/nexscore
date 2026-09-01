// app/api/match/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get("createdBy");

    let snapshot;

    // 🛡️ যদি কোনো নির্দিষ্ট অ্যাডমিন তার নিজের ম্যাচ চায়
    if (createdBy) {
      snapshot = await adminFirestore
        .collection("matches_history")
        .where("createdBy", "==", createdBy)
        .get();
    } else {
      snapshot = await adminFirestore
        .collection("matches_history")
        .orderBy("completedAt", "desc")
        .limit(50)
        .get();
    }

    if (snapshot.empty) {
      return NextResponse.json({ success: true, matches: [] });
    }

    let matches = snapshot.docs.map((doc: any) => {
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

    // ইন-মেমোরি ডিসেন্ডিং সর্ট (ফায়ারস্টোর ইনডেক্স এরর ছাড়া দ্রুতগতিতে লোড হবে)
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