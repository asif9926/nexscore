// app/overlay/football/[matchId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useMatchData } from "@/lib/hooks/useMatchData";
import FootballBroadcastEngine from "@/components/overlay/football/BroadcastEngine";
import EventPopup from "@/components/overlay/cricket/EventPopup";
import BroadcastLogoBadge from "@/components/overlay/BroadcastLogoBadge";

export default function FootballOverlayPage() {
  const params = useParams();
  const matchId = params?.matchId as string;
  const { matchData, loading } = useMatchData(matchId);

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
      {/* 🛡️ Layer 10: Football Broadcast Engine (Top Scorebar & Half-Time Cards) */}
      {shouldRenderEngine && (
        <div className="relative z-10 h-full w-full">
          <FootballBroadcastEngine matchId={matchId} theme={activeTheme} />
        </div>
      )}

      {/* 🛡️ Layer 30: Channel Watermark & League Logos */}
      <div className="pointer-events-none relative z-30">
        <BroadcastLogoBadge matchId={matchId} />
      </div>

      {/* 🛡️ Layer 50: Goal & Card Event Popups */}
      <div className="pointer-events-none relative z-50">
        <EventPopup matchId={matchId} />
      </div>
    </main>
  );
}