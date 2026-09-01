// app/overlay/cricket/[matchId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useMatchData } from "@/lib/hooks/useMatchData";
import CricketBroadcastEngine from "@/components/overlay/cricket/BroadcastEngine";
import EventPopup from "@/components/overlay/cricket/EventPopup";
import BroadcastLogoBadge from "@/components/overlay/BroadcastLogoBadge";

export default function CricketOverlayPage() {
  const params = useParams();
  const matchId = params?.matchId as string;
  const { matchData, loading } = useMatchData(matchId);

  if (loading || !matchData?.meta || matchData.meta.showScoreboard === false) {
    return null;
  }

  const activeTheme = matchData.meta.activeTheme || "sky";

  return (
    <main className="relative h-screen w-full overflow-hidden bg-transparent select-none">
      <BroadcastLogoBadge matchId={matchId} />
      <EventPopup matchId={matchId} />
      <CricketBroadcastEngine matchId={matchId} theme={activeTheme} />
    </main>
  );
}