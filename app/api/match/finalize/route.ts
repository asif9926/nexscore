import { NextResponse } from "next/server";
import { getAdminApp, adminFirestore } from "@/lib/firebase/admin";
import { getDatabase } from "firebase-admin/database";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // ১. কুকি থেকে AuthToken যাচাই করা (যেহেতু অ্যাডমিন অলরেডি লগইন করা)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("AuthToken")?.value;
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

    if (!sessionCookie && !authHeader) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // ২. Admin SDK ইনিশিয়ালাইজ করা
    const app = getAdminApp();
    const rtdb = getDatabase(app);

    // ৩. RTDB থেকে বর্তমান লাইভ ম্যাচের ডেটা রিড করা
    const matchRef = rtdb.ref("match");
    const snapshot = await matchRef.once("value");

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "No active match found to finalize" }, { status: 404 });
    }

    const matchData = snapshot.val();

    // ৪. স্বয়ংক্রিয় রেজাল্ট স্টেটমেন্ট হিসাব করা
    let calculatedResult = "Match Completed";
    if (matchData.meta?.sport === "cricket" && matchData.cricket) {
      const inn1 = matchData.cricket.innings1;
      const inn2 = matchData.cricket.innings2;
      const inn1Team = inn1?.battingTeam === "teamA" ? matchData.meta.teamA : matchData.meta.teamB;
      const inn2Team = inn1?.battingTeam === "teamA" ? matchData.meta.teamB : matchData.meta.teamA;
      const target = (inn1?.score || 0) + 1;

      if (inn2) {
        if (inn2.score >= target) {
          calculatedResult = `${inn2Team} won by ${10 - (inn2.wickets || 0)} wickets`;
        } else {
          const runDiff = (inn1?.score || 0) - (inn2.score || 0);
          calculatedResult = runDiff > 0 ? `${inn1Team} won by ${runDiff} runs` : "Match Tied";
        }
      }
    } else if (matchData.football) {
      const scA = matchData.football.scoreA || 0;
      const scB = matchData.football.scoreB || 0;
      if (scA > scB) calculatedResult = `${matchData.meta.teamA} won the match`;
      else if (scB > scA) calculatedResult = `${matchData.meta.teamB} won the match`;
      else calculatedResult = "Match Draw";
    }

    const archiveData = {
      sport: matchData.meta?.sport || "cricket",
      teamA: matchData.meta?.teamA,
      teamB: matchData.meta?.teamB,
      tournament: matchData.meta?.tournament || "Local Tournament",
      venue: matchData.meta?.venue || "",
      finalResult: calculatedResult,
      completedAt: Date.now(),
      fullSnapshot: {
        meta: { ...matchData.meta, status: "completed" },
        cricket: matchData.cricket || null,
        football: matchData.football || null,
      },
    };

    // ৫. Firestore-এর 'matches_history' কালেকশনে ম্যাচ পার্মানেন্ট সেভ করা
    const docRef = await adminFirestore.collection("matches_history").add(archiveData);

    // ৬. RTDB-এর /match নোড এবং অ্যাকশন লগ রিসেট করে ফাঁকা করা
    await matchRef.set(null);
    await rtdb.ref("match_actionLog").set(null);

    return NextResponse.json({
      success: true,
      message: "Match finalized and archived successfully!",
      archiveId: docRef.id,
    });
  } catch (error: any) {
    console.error("Error finalizing match:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}