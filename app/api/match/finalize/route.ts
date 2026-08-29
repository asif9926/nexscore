// app/api/match/finalize/route.ts
import { NextResponse } from "next/server";
import { getAdminApp, adminFirestore } from "@/lib/firebase/admin";
import { getDatabase } from "firebase-admin/database";
import { verifyAdminRequest } from "@/lib/firebase/verifyAdmin";

export async function POST(request: Request) {
  // ০. সবার আগে অথেন্টিকেশন চেক — এই route Admin SDK দিয়ে security rules বাইপাস
  // করে এবং লাইভ ম্যাচ ওয়াইপ করে দেয়, তাই middleware-এর উপর ভরসা না করে নিজে থেকেই
  // ভেরিফাই করতে হবে যে caller আসলেই একজন logged-in admin (দেখো verifyAdmin.ts-এর কমেন্ট)।
  const admin = await verifyAdminRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ১. Admin SDK ইনিশিয়ালাইজ করা (Security Rules বাইপাস করার জন্য)
    const app = getAdminApp();
    const rtdb = getDatabase(app);

    // ২. RTDB থেকে বর্তমান লাইভ ম্যাচের ডেটা রিড করা
    const matchRef = rtdb.ref("match");
    const snapshot = await matchRef.once("value");
    
    if (!snapshot.exists()) {
      return NextResponse.json({ error: "No active match found" }, { status: 404 });
    }

    const matchData = snapshot.val();

    // ৩. ব্লুপ্রিন্ট অনুযায়ী হিস্ট্রিতে সেভ করার আগে অপ্রয়োজনীয় লাইভ ডেটা (actionLog, presence) বাদ দেওয়া
    // ৩. স্বয়ংক্রিয় রেজাল্ট স্টেটমেন্ট হিসাব করা
    let calculatedResult = "Match Completed";
    if (matchData.meta?.sport === "cricket" && matchData.cricket) {
      const inn1 = matchData.cricket.innings1;
      const inn2 = matchData.cricket.innings2;
      const inn1Team = inn1?.battingTeam === "teamA" ? matchData.meta.teamA : matchData.meta.teamB;
      const inn2Team = inn1?.battingTeam === "teamA" ? matchData.meta.teamB : matchData.meta.teamA;
      const target = (inn1?.score || 0) + 1;

      if (inn2) {
        if (inn2.score >= target) {
          calculatedResult = `${inn2Team} won by ${10 - inn2.wickets} wickets`;
        } else {
          const runDiff = (inn1?.score || 0) - inn2.score;
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
      finalResult: calculatedResult,
      completedAt: Date.now(),
      finalizedBy: admin.uid,
      fullSnapshot: {
        meta: { ...matchData.meta, status: "completed" },
        cricket: matchData.cricket || null,
        football: matchData.football || null,
      }
    };

    // ৪. Firestore-এর 'matches_history' কালেকশনে ডেটা সেভ করা
    const docRef = await adminFirestore.collection("matches_history").add(archiveData);

    // ৫. RTDB-এর /match নোডটি রিসেট করে দেওয়া (পরের নতুন ম্যাচের জন্য জায়গা খালি করা)
    await matchRef.set(null);

    return NextResponse.json({ 
      success: true, 
      message: "Match finalized and archived successfully!",
      archiveId: docRef.id
    });

  } catch (error) {
    console.error("Error finalizing match:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
