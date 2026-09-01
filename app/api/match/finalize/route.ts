// app/api/match/finalize/route.ts
import { NextResponse } from "next/server";
import { adminFirestore, adminAuth, adminRtdb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("AuthToken")?.value;
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

    let isAuthorized = false;
    let adminUid: string | null = null;

    // ১. সেশন কুকি যাচাই
    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        isAuthorized = true;
        adminUid = decoded.uid;
      } catch {
        isAuthorized = false;
      }
    }

    // ২. ফলব্যাক: বিয়ারার আইডি টোকেন যাচাই
    if (!isAuthorized && authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const idToken = authHeader.substring(7).trim();
        const decoded = await adminAuth.verifyIdToken(idToken, true);
        isAuthorized = true;
        adminUid = decoded.uid;
      } catch {
        isAuthorized = false;
      }
    }

    if (!isAuthorized || !adminUid) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin session." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const matchId = body?.matchId;

    if (!matchId) {
      return NextResponse.json({ error: "Missing matchId parameter." }, { status: 400 });
    }

    const matchRef = adminRtdb.ref(`matches/${matchId}`);
    const snapshot = await matchRef.once("value");

    if (!snapshot.exists()) {
      return NextResponse.json({ error: "Match not found or already archived." }, { status: 404 });
    }

    const matchData = snapshot.val();

    // ৩. ওনারশিপ ভেরিফিকেশন (অন্য অ্যাডমিনের ম্যাচ ফাইনাল করা বন্ধ করা)
    if (matchData.meta?.createdBy && matchData.meta.createdBy !== adminUid) {
      return NextResponse.json({ error: "Forbidden: You cannot end another admin's match." }, { status: 403 });
    }

    // ৪. ফাইনাল ফলাফল ক্যালকুলেশন
    let calculatedResult = "Match Completed";
    if (matchData.meta?.sport === "cricket" && matchData.cricket) {
      const inn1 = matchData.cricket.innings1;
      const inn2 = matchData.cricket.innings2;
      const inn1Team = inn1?.battingTeam === "teamA" ? matchData.meta.teamA : matchData.meta.teamB;
      const inn2Team = inn1?.battingTeam === "teamA" ? matchData.meta.teamB : matchData.meta.teamA;
      const target = (inn1?.score || 0) + 1;
      const maxOvers = matchData.cricket.maxOvers || 20;

      const chasingSquadKey = inn2?.battingTeam || (inn1?.battingTeam === "teamA" ? "teamB" : "teamA");
      const squadCount = matchData.cricket.squads?.[chasingSquadKey]?.length || 11;
      const maxWickets = Math.max(1, squadCount - 1);

      if (matchData.cricket.currentInnings === 1 || !inn2 || (inn2.score === 0 && !inn2.overs)) {
        calculatedResult = `${inn1Team} scored ${inn1?.score || 0}/${inn1?.wickets || 0} (${inn1?.overs || "0.0"} ov) • Match Incomplete`;
      } else {
        if (inn2.score >= target) {
          const wicketsLeft = Math.max(0, maxWickets - (inn2.wickets || 0));
          calculatedResult = `${inn2Team} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? "s" : ""}`;
        } else {
          const [o] = (inn2.overs || "0.0").split(".").map(Number);
          const isInn2Finished = inn2.isCompleted || o >= maxOvers || (inn2.wickets || 0) >= maxWickets;

          if (isInn2Finished) {
            const runDiff = (inn1?.score || 0) - (inn2.score || 0);
            if (runDiff > 0) calculatedResult = `${inn1Team} won by ${runDiff} runs`;
            else if (runDiff === 0) calculatedResult = "Match Tied (Super Over)";
          } else {
            calculatedResult = `Match Ended: ${inn2Team} need ${Math.max(0, target - inn2.score)} runs`;
          }
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
      createdBy: matchData.meta?.createdBy || adminUid,
      teamA: matchData.meta?.teamA,
      teamB: matchData.meta?.teamB,
      tournament: matchData.meta?.tournament || "Local Tournament",
      venue: matchData.meta?.venue || "",
      finalResult: calculatedResult,
      completedAt: Date.now(),
      fullSnapshot: {
        ...matchData,
        meta: { 
          ...matchData.meta, 
          status: "completed", 
          finalResult: calculatedResult,
          createdBy: matchData.meta?.createdBy || adminUid 
        },
        cricket: matchData.cricket || null,
        football: matchData.football || null,
      },
    };

    // ৫. Firestore-এ আর্কাইভ সেভ
    const docRef = await adminFirestore.collection("matches_history").add(archiveData);

    // ৬. RTDB থেকে লাইভ ডাটা ও পয়েন্টার ক্লিনআপ
    await matchRef.set(null);
    await adminRtdb.ref(`match_actionLogs/${matchId}`).set(null);
    await adminRtdb.ref(`admin_active_matches/${adminUid}`).set(null);

    // ৭. Next.js স্ট্যাটিক ও ডাইনামিক ক্যাশ রিভ্যালিডেশন
    revalidatePath("/");
    revalidatePath("/live");
    revalidatePath("/match-history");
    revalidatePath("/admin");

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