import { NextResponse } from "next/server";
import { getAdminApp, adminFirestore } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("AuthToken")?.value;
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

    const app = getAdminApp();
    const authAdmin = getAuth(app);
    let isAuthorized = false;

    // ১. সেশন কুকি অথবা Bearer Token ক্রিপ্টোগ্রাফিক যাচাই
    if (sessionCookie) {
      try {
        await authAdmin.verifySessionCookie(sessionCookie, true);
        isAuthorized = true;
      } catch {
        isAuthorized = false;
      }
    }

    if (!isAuthorized && authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.substring(7).trim();
        await authAdmin.verifyIdToken(idToken, true);
        isAuthorized = true;
      } catch {
        isAuthorized = false;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired admin session." }, { status: 401 });
    }

    // ২. RTDB থেকে বর্তমান লাইভ ম্যাচের ডেটা রিড করা
    const rtdb = getDatabase(app);
    const matchRef = rtdb.ref("match");
    const snapshot = await matchRef.once("value");

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "No active match found to finalize" }, { status: 404 });
    }

    const matchData = snapshot.val();

    // ৩. ডাইনামিক রেজাল্ট স্টেটমেন্ট হিসাব (স্কোয়াড সাইজ অনুযায়ী)
    let calculatedResult = "Match Completed";
    if (matchData.meta?.sport === "cricket" && matchData.cricket) {
      const inn1 = matchData.cricket.innings1;
      const inn2 = matchData.cricket.innings2;
      const inn1Team = inn1?.battingTeam === "teamA" ? matchData.meta.teamA : matchData.meta.teamB;
      const inn2Team = inn1?.battingTeam === "teamA" ? matchData.meta.teamB : matchData.meta.teamA;
      const target = (inn1?.score || 0) + 1;

      // স্কোয়াড সাইজ থেকে ম্যাক্সিমাম উইকেটের হিসাব
      const chasingSquadKey = inn2?.battingTeam || (inn1?.battingTeam === "teamA" ? "teamB" : "teamA");
      const squadCount = matchData.cricket.squads?.[chasingSquadKey]?.length || 11;
      const maxWickets = Math.max(1, squadCount - 1);

      if (inn2) {
        if (inn2.score >= target) {
          const wicketsLeft = Math.max(0, maxWickets - (inn2.wickets || 0));
          calculatedResult = `${inn2Team} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? "s" : ""}`;
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

    // ৪. Firestore-এ ম্যাচ পার্মানেন্ট সেভ
    const docRef = await adminFirestore.collection("matches_history").add(archiveData);

    // ৫. RTDB রিসেট
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