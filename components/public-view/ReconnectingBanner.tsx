// components/public-view/ReconnectingBanner.tsx
"use client";

import { useEffect, useState } from "react";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { MatchData } from "@/lib/types/match";
import { WifiOff } from "lucide-react";

interface Props {
  matchId?: string;
  matchData?: MatchData | null;
}

// 🛡️ ৬০ সেকেন্ডের স্ট্যান্ডার্ড ব্রডকাস্ট ডিবউন্স
const DEBOUNCE_MS = 60 * 1000;

export default function ReconnectingBanner({ matchId, matchData: propMatchData }: Props) {
  // প্যারেন্ট থেকে matchData এলে সেটি ব্যবহার হবে, না হলে matchId দিয়ে ফেচ হবে
  const { matchData: fetchedMatchData } = useMatchData(propMatchData ? undefined : matchId);
  const matchData = propMatchData || fetchedMatchData;

  const [showBanner, setShowBanner] = useState(false);

  const isLive = matchData?.meta?.status === "live";
  const admins = matchData?.presence?.admins;
  const hasActiveAdminSession = !!admins && Object.keys(admins).length > 0;

  useEffect(() => {
    // ম্যাচ ডাটা না থাকলে বা ম্যাচ অলরেডি সমাপ্ত হলে ব্যানার কখনোই দেখাবে না
    if (!matchData || !isLive) {
      setShowBanner(false);
      return;
    }

    if (hasActiveAdminSession) {
      setShowBanner(false);
      return;
    }

    const timer = setTimeout(() => setShowBanner(true), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [hasActiveAdminSession, matchData, isLive]);

  if (!showBanner) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex animate-pulse items-center justify-center gap-2 bg-crimson py-2 text-center text-sm font-medium text-white shadow-lg">
      <WifiOff size={16} />
      <span>Live score feed reconnecting... Scorer offline.</span>
    </div>
  );
}