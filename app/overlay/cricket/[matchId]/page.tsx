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

  if (loading || !matchData?.meta) {
    return null;
  }

  const activeTheme = matchData.meta.activeTheme || "sky";
  const isScoreboardVisible = matchData.meta.showScoreboard !== false;
  const hasActiveSpecialGraphic =
    matchData.meta.activeGraphic && matchData.meta.activeGraphic !== "LOWER_THIRD";
  const shouldRenderEngine = isScoreboardVisible || hasActiveSpecialGraphic;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-transparent select-none">
      {/* 🛡️ Layer 10: Broadcast Engine (Lower-Third, Batter/Bowler Cards, Result Posters) */}
      {shouldRenderEngine && (
        <div className="relative z-10 h-full w-full">
          <CricketBroadcastEngine matchId={matchId} theme={activeTheme} />
        </div>
      )}

      {/* 🛡️ Layer 30: Channel & Tournament Logos (Top Bugs) */}
      <div className="pointer-events-none relative z-30">
        <BroadcastLogoBadge matchId={matchId} />
      </div>

      {/* 🛡️ Layer 50: Event Celebration Popups (FOUR, SIX, WICKET, 50, 100) */}
      <div className="pointer-events-none relative z-50">
        <EventPopup matchId={matchId} />
      </div>
    </main>
  );
}