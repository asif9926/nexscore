// components/public-view/tabs/InfoTab.tsx
"use client";

import type { MatchData } from "@/lib/types/match";
import { Calendar, MapPin, Trophy, Shield, Activity } from "lucide-react";

interface Props {
  matchData: MatchData | null;
}

export default function InfoTab({ matchData }: Props) {
  if (!matchData?.meta) return null;

  const { meta, cricket, football } = matchData;
  const isCricket = meta.sport === "cricket";

  // 🛡️ Safe Date fallback to prevent TS2769 (undefined argument)
  const timestamp = meta.createdAt || meta.updatedAt || Date.now();
  const dateObj = new Date(timestamp);

  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-panel p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-fg flex items-center gap-2">
          <Trophy size={16} className="text-electric" /> Match Details &amp; Venue
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-ink p-3.5">
            <Calendar size={18} className="text-signal-gold shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] uppercase font-bold text-fg-muted">Date &amp; Time</div>
              <div className="font-semibold text-fg mt-0.5">{formattedDate}</div>
              <div className="text-fg-faint text-[11px]">{formattedTime}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-ink p-3.5">
            <MapPin size={18} className="text-crimson shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] uppercase font-bold text-fg-muted">Venue &amp; Ground</div>
              <div className="font-semibold text-fg mt-0.5">{meta.venue || "Local Sports Ground"}</div>
              <div className="text-fg-faint text-[11px]">{meta.tournament || "Local Tournament"}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-ink p-3.5">
            <Shield size={18} className="text-pitch-green shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] uppercase font-bold text-fg-muted">Match Format</div>
              <div className="font-semibold text-fg mt-0.5">{meta.teamA} vs {meta.teamB}</div>
              <div className="text-fg-faint text-[11px]">
                {isCricket ? `Limited Overs (${cricket?.maxOvers || 20} Ov)` : `${football?.half || "90 Mins"} Match`}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-ink p-3.5">
            <Activity size={18} className="text-electric shrink-0 mt-0.5" />
            <div>
              <div className="text-[10px] uppercase font-bold text-fg-muted">Toss &amp; Status</div>
              <div className="font-semibold text-fg mt-0.5 capitalize">{meta.status || "Live"}</div>
              {isCricket && cricket?.toss && cricket.toss.winner ? (
                <div className="text-fg-faint text-[11px]">
                  Toss: {cricket.toss.winner === "teamA" ? meta.teamA : meta.teamB} elected to {cricket.toss.decision}
                </div>
              ) : (
                <div className="text-fg-faint text-[11px]">Status: Broadcast Active</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}