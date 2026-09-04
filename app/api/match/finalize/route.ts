// app/api/match/finalize/route.ts
import { NextResponse } from "next/server";
import { adminFirestore, adminAuth, adminRtdb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { calculateMatchResult } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("AuthToken")?.value;
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

    let isAuthorized = false;
    let adminUid: string | null = null;

    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        isAuthorized = true;
        adminUid = decoded.uid;
      } catch {
        isAuthorized = false;
      }
    }

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
    const matchCreator = matchData.meta?.createdBy;

    // 🛡️ Fix #5: ওনারশিপ এনফোর্সমেন্ট (matchCreator না থাকলেও অন্য অ্যাডমিন ফাইনাল করতে পারবে না)
    if (!matchCreator || matchCreator !== adminUid) {
      return NextResponse.json({ error: "Forbidden: You cannot end another admin's match." }, { status: 403 });
    }

    // 🛡️ Fix #9: সেন্ট্রাল রেজাল্ট ইঞ্জিন ব্যবহার
    const calculatedResult = calculateMatchResult(matchData);

    // 🛡️ Firestore 1MB সাইজ রক্ষা: অপ্রয়োজনীয় actionLogs ও প্রেজেন্স ছাঁটাই
    const sanitizedSnapshot = { ...matchData };
    delete sanitizedSnapshot.actionLogs;
    delete (sanitizedSnapshot as any).match_actionLogs;

    const archiveData = {
      sport: matchData.meta?.sport || "cricket",
      createdBy: adminUid,
      teamA: matchData.meta?.teamA || "Team A",
      teamB: matchData.meta?.teamB || "Team B",
      tournament: matchData.meta?.tournament || "Local Tournament",
      venue: matchData.meta?.venue || "",
      finalResult: calculatedResult,
      completedAt: Date.now(),
      fullSnapshot: {
        ...sanitizedSnapshot,
        meta: { 
          ...matchData.meta, 
          status: "completed", 
          finalResult: calculatedResult,
          createdBy: adminUid,
          completedAt: Date.now(),
        },
        cricket: matchData.cricket || null,
        football: matchData.football || null,
      },
    };

    // 🛡️ Fix: .add() এর বদলে সরাসরি matchId দিয়ে ডকুমেন্ট সেট করা (লিংক কখনো ভাঙবে না)
    await adminFirestore.collection("matches_history").doc(matchId).set(archiveData);

    // RTDB থেকে লাইভ নোড ক্লিনআপ
    const atomicUpdates: Record<string, null> = {
      [`matches/${matchId}`]: null,
      [`match_actionLogs/${matchId}`]: null,
      [`admin_active_matches/${adminUid}/${matchId}`]: null,
    };
    await adminRtdb.ref().update(atomicUpdates);

    revalidatePath("/", "page");
    revalidatePath("/live", "page");
    revalidatePath("/match-history", "page");
    revalidatePath(`/match-history/${matchId}`, "page");
    revalidatePath("/admin", "page");

    return NextResponse.json({
      success: true,
      message: "Match finalized and archived successfully!",
      archiveId: matchId,
    });
  } catch (error: any) {
    console.error("Error finalizing match:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}