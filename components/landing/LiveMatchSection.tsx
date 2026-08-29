"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { useFootballClock } from "@/lib/hooks/useFootballClock";
import { Trophy, Radio, History, Tv, ExternalLink, Globe } from "lucide-react";

const calculateCRR = (score: number, oversStr: string | number) => {
  if (!oversStr) return "0.00";
  const [overs, balls] = String(oversStr).split(".").map(Number);
  const totalBalls = (overs || 0) * 6 + (balls || 0);
  if (totalBalls === 0) return "0.00";
  return ((score / totalBalls) * 6).toFixed(2);
};

export default function LiveMatchSection() {
  const { matchData, loading } = useMatchData();
  const footballClock = useFootballClock(matchData?.football);

  const isLive = matchData?.meta?.status === "live";
  const { meta, cricket, football } = matchData || {};

  const currentInningsKey = cricket?.currentInnings === 2 ? "innings2" : "innings1";
  const currentInnings = cricket?.[currentInningsKey];
  const battingTeamName = currentInnings?.battingTeam === "teamA" ? meta?.teamA : meta?.teamB;

  return (
    <div className="mb-6 sm:mb-10 w-full min-w-0">
      {loading ? (
        <div className="rounded-2xl border border-border bg-panel p-8 text-center shadow-xl sm:rounded-3xl sm:p-12">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-border border-t-electric" />
          <p className="text-xs font-medium text-fg-muted">Connecting to live feed...</p>
        </div>
      ) : isLive && meta ? (
        /* ১. ম্যাচ লাইভ থাকলে অন-এয়ার স্কোরকার্ড */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-4 shadow-2xl transition-colors hover:border-fg-faint sm:rounded-3xl sm:p-7"
        >
          <div className="pointer-events-none absolute right-0 top-0 hidden h-64 w-64 rounded-full bg-electric/15 blur-3xl sm:block" />
          <div className="pointer-events-none absolute bottom-0 left-0 hidden h-64 w-64 rounded-full bg-signal-gold/15 blur-3xl sm:block" />

          {/* Top Status & Badge Bar */}
          <div className="relative z-10 mb-3 flex flex-col gap-2 border-b border-border pb-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-crimson" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-crimson">
                ON AIR • {meta.sport}
              </span>
              <span className="truncate text-xs font-medium text-fg-muted">
                • {meta.tournament || "Local Tournament"}
              </span>
            </div>

            {meta.sport === "cricket" && currentInnings ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-electric/20 bg-electric/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-electric">
                  CRR: <span className="text-fg">{calculateCRR(currentInnings.score || 0, currentInnings.overs || "0.0")}</span>
                </span>
                {cricket?.currentInnings === 2 && currentInnings.target && (
                  <span className="rounded-full border border-signal-gold/20 bg-signal-gold/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-signal-gold">
                    Target: <span className="text-fg">{currentInnings.target}</span>
                  </span>
                )}
              </div>
            ) : (
              <span className="w-max rounded-full border border-pitch-green/20 bg-pitch-green/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-pitch-green">
                Live Broadcast
              </span>
            )}
          </div>

          {/* Main Teams & Score Section */}
          <div className="relative z-10 grid grid-cols-1 items-center gap-4 sm:gap-6 md:grid-cols-2">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-xl font-black tracking-tight text-fg sm:text-2xl md:text-3xl break-words">
                <span>{meta.teamA}</span>
                <span className="mx-1.5 text-sm font-medium text-fg-faint sm:text-xl">vs</span>
                <span>{meta.teamB}</span>
              </h3>

              {meta.sport === "cricket" ? (
                <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-electric md:justify-start">
                  <span>🏏</span> {battingTeamName} batting
                </p>
              ) : (
                <p className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-pitch-green md:justify-start">
                  <span>⚽</span> Live Football
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center space-y-3 md:items-end">
              {meta.sport === "cricket" ? (
                <div className="text-center md:text-right">
                  <div className="font-score text-4xl leading-none text-fg sm:text-5xl">
                    {currentInnings?.score || 0}
                    <span className="mx-1 text-2xl text-fg-faint sm:text-3xl">/</span>
                    {currentInnings?.wickets || 0}
                  </div>
                  <div className="mt-1 inline-block rounded-full border border-border bg-ink px-3 py-0.5 font-mono text-xs text-fg-muted">
                    Overs: <strong className="text-fg">{currentInnings?.overs || "0.0"}</strong>
                  </div>
                </div>
              ) : (
                <div className="text-center md:text-right">
                  <div className="font-score text-4xl leading-none text-fg sm:text-5xl">
                    {football?.scoreA || 0} <span className="mx-1 text-2xl text-fg-faint">-</span> {football?.scoreB || 0}
                  </div>
                  <div className="mt-1 inline-block rounded-full border border-border bg-ink px-3 py-0.5 font-mono text-xs text-fg-muted">
                    <span className="mr-1.5 font-bold text-pitch-green">{footballClock.display}'</span>{" "}
                    {football?.half || "1ST HALF"}
                  </div>
                </div>
              )}

              <div className="w-full pt-0.5 sm:w-auto">
                <Link href="/live" className="block w-full">
                  <button className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-full bg-electric px-5 py-2 text-xs font-bold text-white shadow-md shadow-electric/20 transition-all hover:scale-[1.02] active:scale-95 sm:min-h-[44px] sm:text-sm">
                    <Radio className="h-4 w-4" /> Watch Live Center
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ২. কোনো ম্যাচ লাইভ না থাকলে: Streamvex হাইলাইট + আর্কাইভ বাটন */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-panel p-6 sm:p-8 text-center shadow-2xl sm:rounded-3xl"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-electric/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-signal-gold/10 blur-2xl" />

          <div className="relative z-10 space-y-3">
            <div className="mx-auto mb-1 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-border bg-ink text-fg-faint shadow-inner">
              <Trophy size={24} className="text-signal-gold/80" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-fg">No Local Match Currently Live</h3>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-fg-muted sm:text-sm">
              Local tournament matches will appear here automatically when on-air. In the meantime, watch international matches live or explore previous scorecards.
            </p>

            {/* Action Buttons Row */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              {/* Highlighted Streamvex Button */}
              <a
                href="https://streamvex-live.vercel.app/" // আপনার Streamvex ওয়েবসাইটের আসল URL দিয়ে রিপ্লেস করে নিবেন
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-electric via-blue-600 to-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-electric/25 transition-all hover:scale-105 active:scale-95"
              >
                <Tv size={15} className="animate-pulse text-signal-gold" />
                <span>Watch International Matches • Streamvex</span>
                <ExternalLink size={13} className="opacity-80 transition-transform group-hover:translate-x-0.5" />
              </a>

              {/* Archives Button */}
              <Link href="/match-history" className="w-full sm:w-auto">
                <button className="flex min-h-[42px] w-full sm:w-auto items-center justify-center gap-1.5 rounded-full border border-border bg-ink px-4 py-2.5 text-xs font-semibold text-fg-muted transition-colors hover:border-fg-faint hover:text-fg">
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