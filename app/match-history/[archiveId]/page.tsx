// app/match-history/[archiveId]/page.tsx
import { notFound } from "next/navigation";
import { adminFirestore } from "@/lib/firebase/admin";
import LiveMatchCenter from "@/components/public-view/LiveMatchCenter";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import MatchShareActions from "@/components/public-view/MatchShareActions";
import type { Metadata } from "next";

export const revalidate = 300;

interface Props {
  params: Promise<{ archiveId: string }>;
}

// 🛡️ ডায়নামিক এসইও ও সোশ্যাল শেয়ার মেটাডেটা (WhatsApp / Facebook Rich Preview)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { archiveId } = await params;
  const doc = await adminFirestore.collection("matches_history").doc(archiveId).get();
  
  if (!doc.exists) {
    return { title: "Match Not Found | NexScore" };
  }

  const match = doc.data()!;
  const teamA = match.teamA || match.meta?.teamA || "Team A";
  const teamB = match.teamB || match.meta?.teamB || "Team B";
  const result = match.finalResult || "Match Completed";
  const tournament = match.tournament || match.meta?.tournament || "Tournament Match";

  const ogImageUrl = `/api/scorecard/${archiveId}/image`;

  return {
    title: `${teamA} vs ${teamB} | Match Result & Scorecard`,
    description: `${result} • ${tournament}. View the full ball-by-ball scorecard on NexScore.`,
    openGraph: {
      title: `${teamA} vs ${teamB} | NexScore Official Result`,
      description: `${result} • ${tournament}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${teamA} vs ${teamB}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${teamA} vs ${teamB} | NexScore Official Result`,
      description: `${result} • ${tournament}`,
      images: [ogImageUrl],
    },
  };
}

export default async function MatchDetailPage({ params }: Props) {
  const { archiveId } = await params;
  const doc = await adminFirestore.collection("matches_history").doc(archiveId).get();
  if (!doc.exists) notFound();

  const match = doc.data()!;
  const rawSnapshot = match.fullSnapshot || {};

  // 🛡️ ফুল স্ন্যাপশট ও রুট ডেটার নিরাপদ মার্জ
  const matchData: any = {
    ...rawSnapshot,
    meta: {
      sport: match.sport || match.meta?.sport || rawSnapshot.meta?.sport || "cricket",
      teamA: match.teamA || match.meta?.teamA || rawSnapshot.meta?.teamA || "Team A",
      teamB: match.teamB || match.meta?.teamB || rawSnapshot.meta?.teamB || "Team B",
      tournament: match.tournament || match.meta?.tournament || rawSnapshot.meta?.tournament || "Tournament Match",
      venue: match.venue || match.meta?.venue || rawSnapshot.meta?.venue || "",
      finalResult: match.finalResult || rawSnapshot.meta?.finalResult || "Match Completed",
      completedAt: match.completedAt || rawSnapshot.meta?.updatedAt || Date.now(),
      status: "completed",
      ...rawSnapshot.meta,
    },
    presence: rawSnapshot.presence || { lastPing: 0 },
    cricket: rawSnapshot.cricket || match.cricket || undefined,
    football: rawSnapshot.football || match.football || undefined,
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block">
        <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto mt-2 sm:mt-4 w-full max-w-5xl min-w-0 overflow-hidden px-3.5 pb-20 sm:px-6 md:p-6">
        <MatchShareActions archiveId={archiveId} />
        <LiveMatchCenter matchData={matchData} />
      </div>
      <Footer />
    </div>
  );
}