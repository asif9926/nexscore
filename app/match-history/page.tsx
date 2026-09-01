// app/match-history/page.tsx
import { adminFirestore } from "@/lib/firebase/admin";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import MatchHistoryClient from "./MatchHistoryClient";

export const revalidate = 60;

export default async function MatchHistoryPage() {
  let matches: any[] = [];
  try {
    const snapshot = await adminFirestore
      .collection("matches_history")
      .orderBy("completedAt", "desc")
      .limit(50)
      .get();

    // মেমরি ও ব্যান্ডউইথ সেভ করতে শুধু সামারি ফিল্ড ম্যাপ করা হলো
    matches = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const cricketSnap = data.fullSnapshot?.cricket || data.cricket;
      const footballSnap = data.fullSnapshot?.football || data.football;

      return {
        id: doc.id,
        sport: data.sport || data.meta?.sport || "cricket",
        teamA: data.teamA || data.meta?.teamA || "Team A",
        teamB: data.teamB || data.meta?.teamB || "Team B",
        tournament: data.tournament || data.meta?.tournament || "Tournament Match",
        venue: data.venue || data.meta?.venue || "",
        finalResult: data.finalResult || "Match Completed",
        completedAt: data.completedAt || data.fullSnapshot?.meta?.updatedAt || Date.now(),
        cricket: cricketSnap
          ? {
              innings1: cricketSnap.innings1
                ? {
                    score: cricketSnap.innings1.score ?? 0,
                    wickets: cricketSnap.innings1.wickets ?? 0,
                    overs: cricketSnap.innings1.overs || "0.0",
                    battingTeam: cricketSnap.innings1.battingTeam,
                  }
                : null,
              innings2: cricketSnap.innings2
                ? {
                    score: cricketSnap.innings2.score ?? 0,
                    wickets: cricketSnap.innings2.wickets ?? 0,
                    overs: cricketSnap.innings2.overs || "0.0",
                    battingTeam: cricketSnap.innings2.battingTeam,
                    isCompleted: cricketSnap.innings2.isCompleted || false,
                  }
                : null,
              squads: {
                teamA: cricketSnap.squads?.teamA || [],
                teamB: cricketSnap.squads?.teamB || [],
              },
            }
          : null,
        football: footballSnap
          ? {
              scoreA: footballSnap.scoreA ?? 0,
              scoreB: footballSnap.scoreB ?? 0,
              redCardsA: footballSnap.redCardsA ?? 0,
              redCardsB: footballSnap.redCardsB ?? 0,
            }
          : null,
      };
    });
  } catch (error) {
    console.error("Error fetching match history:", error);
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block">
        <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl min-w-0 overflow-hidden flex-1 px-3.5 pb-20 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <MatchHistoryClient matches={matches} />
      </div>

      <Footer />
    </div>
  );
}