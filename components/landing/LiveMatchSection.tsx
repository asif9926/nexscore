// components/landing/LiveMatchSection.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAllLiveMatches } from "@/lib/hooks/useMatchData";
import { useFootballClock } from "@/lib/hooks/useFootballClock";
import { Trophy, Radio, History, Tv, ExternalLink, ArrowRight } from "lucide-react";
import type { MatchData } from "@/lib/types/match";

const calculateCRR = (score: number, oversStr: string | number) => {
  if (!oversStr) return "0.00";
  const [overs, balls] = String(oversStr).split(".").map(Number);
  const totalBalls = (overs || 0) * 6 + (balls || 0);
  if (totalBalls === 0) return "0.00";
  return ((score / totalBalls) * 6).toFixed(2);
};

// 🔹 প্রতিটি সিঙ্গেল লাইভ ম্যাচ কার্ড কম্পোনেন্ট
function LiveMatchCard({ id, data, isSingle }: { id: string; data: MatchData; isSingle: boolean }) {
  const { meta, cricket, football } = data;
  const footballClock = useFootballClock(football);

  const isCricket = meta?.sport === "cricket";
  const currentInningsKey = cricket?.currentInnings === 2 ? "innings2" : "innings1";
  const currentInnings = cricket ? cricket[currentInningsKey] : null;
  const battingTeamName = currentInnings?.battingTeam === "teamA" ? meta?.teamA : meta?.teamB;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-panel p-5 shadow-2xl transition-all hover:border-electric/50 hover:shadow-electric/10 ${
        isSingle ? "sm:p-7" : "sm:p-6"
      }`}
    >
      {/* Dynamic Top Glow */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-electric via-pitch-green to-signal-gold" />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-electric/10 blur-3xl" />

      <div className="relative z-10 space-y-4">
        {/* Top Status Row */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-crimson" />
            </span>
            <span className="font-bold uppercase tracking-wider text-crimson text-[11px]">
              ON AIR • {meta?.sport}
            </span>
            <span className="text-fg-faint">•</span>
            <span className="truncate max-w-[140px] font-medium text-fg-muted text-[11px] sm:max-w-[200px]">
              {meta?.tournament || "Local Tournament"}
            </span>
          </div>

          {isCricket && currentInnings ? (
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-electric/20 bg-electric/10 px-2 py-0.5 font-mono text-[10px] font-bold text-electric">
                CRR: <span className="text-fg">{calculateCRR(currentInnings.score || 0, currentInnings.overs || "0.0")}</span>
              </span>
              {cricket?.currentInnings === 2 && currentInnings.target && (
                <span className="hidden rounded-full border border-signal-gold/20 bg-signal-gold/10 px-2 py-0.5 font-mono text-[10px] font-bold text-signal-gold sm:inline">
                  Target: {currentInnings.target}
                </span>
              )}
            </div>
          ) : (
            <span className="rounded-full border border-pitch-green/20 bg-pitch-green/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-pitch-green">
              Live Broadcast
            </span>
          )}
        </div>

        {/* Main Teams & Status */}
        <div className="space-y-1">
          <h3 className={`font-black tracking-tight text-fg break-words ${isSingle ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`}>
            <span>{meta?.teamA}</span>
            <span className="mx-2 text-xs font-normal text-fg-faint sm:text-sm">vs</span>
            <span>{meta?.teamB}</span>
          </h3>

          {isCricket ? (
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-electric">
              <span>🏏</span> {battingTeamName} batting
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pitch-green">
              <span>⚽</span> {football?.half || "1ST HALF"}
            </p>
          )}
        </div>

        {/* Score Display Box */}
        <div className="rounded-2xl border border-border/80 bg-ink/70 p-4 flex items-center justify-between shadow-inner">
          {isCricket ? (
            <>
              <div className="font-score text-3xl sm:text-4xl font-black text-fg">
                {currentInnings?.score || 0}
                <span className="mx-1 text-xl text-fg-faint">/</span>
                {currentInnings?.wickets || 0}
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-fg">
                  {currentInnings?.overs || "0.0"}{" "}
                  <span className="text-[10px] text-fg-faint font-normal">/ {cricket?.maxOvers} ov</span>
                </div>
                {cricket?.currentInnings === 2 && currentInnings?.target && (
                  <div className="text-[11px] font-bold text-signal-gold">
                    Need {Math.max(0, currentInnings.target - (currentInnings.score || 0))} runs
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="font-score text-3xl sm:text-4xl font-black text-fg">
                {football?.scoreA || 0} <span className="mx-1 text-xl text-fg-faint">-</span> {football?.scoreB || 0}
              </div>
              <div className="text-right text-xs">
                <span className="font-mono font-bold text-pitch-green text-sm">
                  {footballClock.display}'
                </span>
                <div className="text-[10px] text-fg-muted font-semibold uppercase">{football?.half || "1ST HALF"}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Button to Live Match Center */}
      <div className="relative z-10 pt-4">
        <Link href={`/live/${id}`} className="block w-full">
          <button className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-electric px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-electric/25 transition-all group-hover:scale-[1.01] active:scale-95">
            <Radio size={15} />
            <span>Enter Live Match Center</span>
            <ArrowRight size={14} className="opacity-80 transition-transform group-hover:translate-x-1" />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

// 🔹 MAIN LIVE MATCH SECTION (হোমপেজ কম্পোনেন্ট)
export default function LiveMatchSection() {
  const { matches: liveMatches, loading } = useAllLiveMatches();

  // হোমপেজে প্রদর্শনের জন্য সর্বোচ্চ ২টি লাইভ ম্যাচ নেওয়া
  const displayedMatches = liveMatches.slice(0, 2);
  const totalLiveCount = liveMatches.length;

  return (
    <div className="mb-6 sm:mb-10 w-full min-w-0">
      {loading ? (
        <div className="rounded-3xl border border-border bg-panel p-8 text-center shadow-xl sm:p-12">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-border border-t-electric" />
          <p className="text-xs font-medium text-fg-muted">Scanning live broadcasts...</p>
        </div>
      ) : totalLiveCount > 0 ? (
        <div className="space-y-4">
          {/* Header Row when 2 or more matches are live */}
          {totalLiveCount > 1 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-fg-muted">
                Ongoing Live Matches ({totalLiveCount})
              </span>
              <Link
                href="/live"
                className="inline-flex items-center gap-1 text-xs font-bold text-electric transition-colors hover:underline"
              >
                <span>View All On-Air Hub</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* 🎯 ১টি ম্যাচ থাকলে ১-কলাম, ২টি ম্যাচ থাকলে ২-কলামের প্রিমিয়াম গ্রিড */}
          <div className={`grid grid-cols-1 gap-5 ${displayedMatches.length === 2 ? "md:grid-cols-2" : ""}`}>
            {displayedMatches.map((m) => (
              <LiveMatchCard
                key={m.id}
                id={m.id}
                data={m.data}
                isSingle={displayedMatches.length === 1}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ❌ কোনো ম্যাচ লাইভ না থাকলে: প্রিমিয়াম এম্পটি স্টেট */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-3xl border border-border bg-panel p-6 sm:p-8 text-center shadow-2xl"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-electric/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-signal-gold/10 blur-2xl" />

          <div className="relative z-10 space-y-3">
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-ink text-fg-faint shadow-inner">
              <Trophy size={26} className="text-signal-gold/80" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-fg">No Local Match Currently Live</h3>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-fg-muted sm:text-sm">
              Local tournament matches will appear here automatically when on-air. You can explore match archives or watch international games.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href="https://streamvex-live.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-electric via-blue-600 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-electric/25 transition-all hover:scale-105 active:scale-95"
              >
                <Tv size={15} className="animate-pulse text-signal-gold" />
                <span>Watch International Matches • Streamvex</span>
                <ExternalLink size={13} className="opacity-80 transition-transform group-hover:translate-x-0.5" />
              </a>

              <Link href="/match-history" className="w-full sm:w-auto">
                <button className="flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-full border border-border bg-ink px-4 py-2.5 text-xs font-semibold text-fg-muted hover:border-fg-faint hover:text-fg">
                  <History size={14} className="text-signal-gold" />
                  <span>Match Archives</span>
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}