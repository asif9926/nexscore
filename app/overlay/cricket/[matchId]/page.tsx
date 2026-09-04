// app/overlay/cricket/[matchId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { MatchDataProvider, useMatchContext } from "@/lib/context/MatchDataContext";
import CricketBroadcastEngine from "@/components/overlay/cricket/BroadcastEngine";
import EventPopup from "@/components/overlay/cricket/EventPopup";
import BroadcastLogoBadge from "@/components/overlay/BroadcastLogoBadge";

function CricketOverlayInner() {
  const { matchData, loading } = useMatchContext();

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
      {shouldRenderEngine && (
        <div className="relative z-10 h-full w-full">
          <CricketBroadcastEngine theme={activeTheme} />
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

export default function CricketOverlayPage() {
  const params = useParams();
  const matchId = (params?.matchId as string) || "";

  // 🛡️ Fix #19: layout.tsx এ OverlayThemeGuard রয়েছে, এখানে রিডান্ডেন্ট র‍্যাপিং বাতিল
  return (
    <MatchDataProvider matchId={matchId}>
      <CricketOverlayInner />
    </MatchDataProvider>
  );
}