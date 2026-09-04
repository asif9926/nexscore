// app/overlay/football/[matchId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { MatchDataProvider, useMatchContext } from "@/lib/context/MatchDataContext";
import FootballBroadcastEngine from "@/components/overlay/football/BroadcastEngine";
import EventPopup from "@/components/overlay/cricket/EventPopup";
import BroadcastLogoBadge from "@/components/overlay/BroadcastLogoBadge";

function FootballOverlayInner() {
  const { matchData, loading } = useMatchContext();

  if (loading || !matchData?.meta) {
    return null;
  }

  const activeTheme = matchData.meta.activeTheme || "premier";
  const isScoreboardVisible = matchData.meta.showScoreboard !== false;
  const hasActiveSpecialGraphic =
    matchData.meta.activeGraphic && matchData.meta.activeGraphic !== "LOWER_THIRD";
  const shouldRenderEngine = isScoreboardVisible || hasActiveSpecialGraphic;

  return (
    <main className="relative h-screen w-full overflow-hidden bg-transparent select-none">
      {shouldRenderEngine && (
        <div className="relative z-10 h-full w-full">
          <FootballBroadcastEngine theme={activeTheme} />
        </div>
      )}

      <div className="pointer-events-none relative z-30">
        <BroadcastLogoBadge />
      </div>

      <div className="pointer-events-none relative z-50">
        <EventPopup />
      </div>
    </main>
  );
}

export default function FootballOverlayPage() {
  const params = useParams();
  const matchId = (params?.matchId as string) || "";

  // 🛡️ Fix #19: Single ThemeGuard enforcement
  return (
    <MatchDataProvider matchId={matchId}>
      <FootballOverlayInner />
    </MatchDataProvider>
  );
}