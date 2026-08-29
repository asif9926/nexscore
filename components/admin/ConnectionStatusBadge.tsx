"use client";

import { useConnectionStatus } from "@/lib/hooks/useConnectionStatus";
import { Wifi, WifiOff } from "lucide-react";

export default function ConnectionStatusBadge() {
  const isOnline = useConnectionStatus();

  if (isOnline) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-pitch-green/20 bg-pitch-green/10 px-3 py-1.5 text-sm text-pitch-green transition-all">
        <Wifi size={14} />
        <span className="font-medium">Online</span>
      </div>
    );
  }

  return (
    <div className="flex animate-pulse items-center gap-2 rounded-full border border-crimson/20 bg-crimson/10 px-3 py-1.5 text-sm text-crimson transition-all">
      <WifiOff size={14} />
      <span className="font-medium">Reconnecting...</span>
    </div>
  );
}
