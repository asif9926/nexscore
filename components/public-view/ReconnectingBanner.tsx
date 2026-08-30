"use client";

import { useEffect, useState } from "react";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { WifiOff } from "lucide-react";

// ১০ মিনিট (১০ * ৬০ * ১০০০ মিলিসেকেন্ড)
const DEBOUNCE_MS = 10 * 60 * 1000; // 600_000 ms

export default function ReconnectingBanner() {
  const { matchData } = useMatchData();
  const [showBanner, setShowBanner] = useState(false);

  const admins = matchData?.presence?.admins;
  const hasActiveAdminSession = !!admins && Object.keys(admins).length > 0;

  useEffect(() => {
    if (!matchData) return;

    if (hasActiveAdminSession) {
      setShowBanner(false);
      return;
    }

    const timer = setTimeout(() => setShowBanner(true), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [hasActiveAdminSession, matchData]);

  if (!showBanner) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-50 flex animate-pulse items-center justify-center gap-2 bg-crimson py-2 text-center text-sm font-medium text-white shadow-lg">
      <WifiOff size={16} />
      <span>Live feed reconnecting... Please wait.</span>
    </div>
  );
}