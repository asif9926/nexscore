// app/overlay/cricket/page.tsx
"use client";

import { useMatchData } from "@/lib/hooks/useMatchData";
import CricketBroadcastEngine from "@/components/overlay/cricket/BroadcastEngine";
import EventPopup from "@/components/overlay/cricket/EventPopup";
import BroadcastLogoBadge from "@/components/overlay/BroadcastLogoBadge";

export default function CricketOverlayPage() {
  const { matchData, loading } = useMatchData();

  if (loading || !matchData?.meta || matchData.meta.showScoreboard === false) {
    return null;
  }

  // অ্যাডমিন প্যানেল থেকে সিলেক্ট করা লাইভ থিম (ডিফল্ট: sky)
  const activeTheme = matchData.meta.activeTheme || "sky";

  return (
    <main className="relative h-screen w-full overflow-hidden bg-transparent select-none">
      <BroadcastLogoBadge />
      <EventPopup />
      <CricketBroadcastEngine theme={activeTheme} />
    </main>
  );
}