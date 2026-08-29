"use client";

import { MatchData } from "@/lib/types/match";
import { Calendar, MapPin, ShieldCheck, Trophy } from "lucide-react";

export default function InfoTab({ matchData }: { matchData: MatchData }) {
  const { meta, cricket } = matchData;
  const isCricket = meta.sport === "cricket";

  return (
    <div className="space-y-6 rounded-3xl border border-border bg-panel p-6 shadow-xl sm:p-8">
      <h3 className="flex items-center gap-2 border-b border-border pb-4 text-lg font-bold text-fg">
        <Trophy className="text-signal-gold" size={20} /> Official Match Information
      </h3>

      <div className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-ink p-3">
            <span className="mb-1 block text-xs uppercase tracking-wider text-fg-muted">Tournament / Series</span>
            <strong className="text-base text-fg">{meta.tournament || "Sports Broadcast Series"}</strong>
          </div>
          <div className="rounded-xl border border-border bg-ink p-3">
            <span className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-fg-muted">
              <MapPin size={12} className="text-crimson" /> Venue & Stadium
            </span>
            <strong className="text-fg">{meta.venue || "Not specified"}</strong>
          </div>
          <div className="rounded-xl border border-border bg-ink p-3">
            <span className="mb-1 block text-xs uppercase tracking-wider text-fg-muted">Match Format</span>
            <strong className="text-fg">{isCricket ? `T20 (${cricket?.maxOvers || 20} Overs)` : "Football Match"}</strong>
          </div>
        </div>

        <div className="space-y-4">
          {isCricket && cricket?.toss && (
            <div className="rounded-xl border border-border bg-ink p-3">
              <span className="mb-1 block text-xs uppercase tracking-wider text-fg-muted">Toss Decision</span>
              <strong className="text-electric">
                {cricket.toss.winner === "teamA" ? meta.teamA : meta.teamB} won the toss and elected to{" "}
                <span className="uppercase text-fg">{cricket.toss.decision}</span>
              </strong>
            </div>
          )}
          <div className="rounded-xl border border-border bg-ink p-3">
            <span className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-fg-muted">
              <Calendar size={12} className="text-electric" /> Match Date
            </span>
            <strong className="text-fg">
              {new Date(meta.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </strong>
          </div>
          <div className="rounded-xl border border-pitch-green/30 bg-pitch-green/10 p-3">
            <span className="mb-1 flex items-center gap-1 text-xs uppercase tracking-wider text-fg-muted">
              <ShieldCheck size={12} className="text-pitch-green" /> Broadcast Status
            </span>
            <strong className="flex items-center gap-2 text-pitch-green">
              <span className="h-2 w-2 animate-pulse rounded-full bg-pitch-green" /> Ultra-Low Latency RTDB Active
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
