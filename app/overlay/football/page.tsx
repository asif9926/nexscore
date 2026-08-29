// app/overlay/football/page.tsx
"use client";

import { useMatchData } from "@/lib/hooks/useMatchData";
import FootballBroadcastEngine from "@/components/overlay/football/BroadcastEngine";
import EventPopup from "@/components/overlay/cricket/EventPopup";
import BroadcastLogoBadge from "@/components/overlay/BroadcastLogoBadge";

export default function FootballOverlayPage() {
  const { matchData, loading } = useMatchData();

  if (loading || !matchData?.meta || matchData.meta.showScoreboard === false) {
    return null;
  }

  // অ্যাডমিন প্যানেল থেকে সিলেক্ট করা লাইভ থিম (ডিফল্ট: premier)
  const activeTheme = matchData.meta.activeTheme || "premier";

  return (
    <main className="relative h-screen w-full overflow-hidden bg-transparent select-none">
      <BroadcastLogoBadge />
      <EventPopup />
      <FootballBroadcastEngine theme={activeTheme} />
    </main>
  );
}