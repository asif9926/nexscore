// components/overlay/football/BroadcastEngine.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { useFootballClock } from "@/lib/hooks/useFootballClock";
import { Activity } from "lucide-react";

interface Props {
  matchId?: string;
  theme?: string;
}

const getTricode = (name?: string, fallback = "TMA") => {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase();
  }
  if (parts.length === 2 && parts[0]?.length && parts[1]?.length) {
    return (parts[0].slice(0, 2) + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
};

export default function FootballBroadcastEngine({ matchId, theme = "premier" }: Props) {
  const { matchData, loading } = useMatchData(matchId);
  const footballClock = useFootballClock(matchData?.football);

  if (loading || !matchData?.meta || !matchData.football) {
    return null;
  }

  const { meta, football } = matchData;
  const activeGraphic = meta.activeGraphic || "LOWER_THIRD";
  const activeTheme = theme || meta.activeTheme || "premier";

  const isScoreboardVisible = meta.showScoreboard !== false;
  const hasSpecialGraphic = activeGraphic !== "LOWER_THIRD";
  if (!isScoreboardVisible && !hasSpecialGraphic) {
    return null;
  }

  const teamACode = getTricode(meta.teamA, "TMA");
  const teamBCode = getTricode(meta.teamB, "TMB");

  const halfData = football.currentHalf === 2 ? football.half2 : football.half1;
  const possession = halfData?.possession || { teamA: 50, teamB: 50 };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 font-sans select-none [transform:translateZ(0)]">
      <AnimatePresence mode="wait">
        {/* ================= ১. HALF TIME / MATCH SUMMARY POSTER ================= */}
        {activeGraphic === "INNINGS_BREAK" && (
          <motion.div
            key="football-match-poster"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-6 backdrop-blur-xl"
          >
            <div className="w-full max-w-xl overflow-hidden rounded-3xl border-2 border-emerald-400 bg-slate-950/95 p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.95)]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-4 py-1 font-broadcast text-xs font-bold uppercase tracking-widest text-emerald-400">
                <Activity size={14} /> {football.half} SUMMARY
              </div>
              
              <div className="mb-6 flex items-center justify-around">
                <div className="text-center">
                  <div className="font-broadcast text-3xl font-black text-white">{meta.teamA}</div>
                  <div className="text-xs font-bold text-slate-400">TEAM A</div>
                </div>
                
                <div className="font-score text-7xl font-bold text-emerald-400">
                  {football.scoreA} <span className="text-4xl text-slate-600">-</span> {football.scoreB}
                </div>
                
                <div className="text-center">
                  <div className="font-broadcast text-3xl font-black text-white">{meta.teamB}</div>
                  <div className="text-xs font-bold text-slate-400">TEAM B</div>
                </div>
              </div>

              {/* Possession Stats */}
              <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                  <span>{possession.teamA}%</span>
                  <span>BALL POSSESSION</span>
                  <span>{possession.teamB}%</span>
                </div>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-emerald-400" style={{ width: `${possession.teamA}%` }} />
                  <div className="h-full bg-sky-400" style={{ width: `${possession.teamB}%` }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= ২. মেইন ৫টি প্রিমিয়াম ফুটবল টিভি থিম ================= */}
        {activeGraphic === "LOWER_THIRD" && isScoreboardVisible && (
          <>
            {/* THEME 1: PREMIER LEAGUE PRO */}
            {activeTheme === "premier" && (
              <motion.div
                key="theme-premier"
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                className="fixed top-8 left-8"
              >
                <div className="flex h-[56px] items-stretch overflow-hidden rounded-xl border border-purple-500/50 bg-[#38003c] shadow-[0_12px_35px_rgba(0,0,0,0.85)]">
                  <div className="flex min-w-[75px] items-center justify-center gap-1.5 bg-[#260029] px-4 font-broadcast text-2xl font-black text-white">
                    <span>{teamACode}</span>
                    {football.redCardsA > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-rose-600 shadow-sm" />}
                  </div>

                  <div className="flex items-center justify-center bg-[#00ff87] px-4 font-score text-3xl font-black text-[#38003c]">
                    <span>{football.scoreA}</span>
                    <span className="mx-1 text-base opacity-60">-</span>
                    <span>{football.scoreB}</span>
                  </div>

                  <div className="flex min-w-[75px] items-center justify-center gap-1.5 bg-[#260029] px-4 font-broadcast text-2xl font-black text-white">
                    {football.redCardsB > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-rose-600 shadow-sm" />}
                    <span>{teamBCode}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-[#38003c] px-4 border-l border-purple-900 text-white">
                    <span className="text-[10px] font-black uppercase text-[#00ff87] tracking-wider">{football.half}</span>
                    <span className="font-score text-base font-bold flex items-center gap-1">
                      {football.isRunning && <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />}
                      {footballClock.display}'
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* THEME 2: UEFA CHAMPIONS LEAGUE */}
            {activeTheme === "ucl" && (
              <motion.div
                key="theme-ucl"
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                className="fixed top-8 left-8"
              >
                <div className="flex h-[56px] items-stretch overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-[#000f2e] shadow-[0_12px_40px_rgba(0,15,46,0.9)]">
                  <div className="flex min-w-[75px] items-center justify-center gap-1 bg-[#00081a] px-4 font-broadcast text-2xl font-black text-white">
                    <span>{teamACode}</span>
                    {football.redCardsA > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-rose-600" />}
                  </div>

                  <div className="flex items-center justify-center border-x border-amber-400/40 bg-[#001744] px-5 font-score text-3xl font-bold text-amber-400">
                    <span>{football.scoreA}</span>
                    <span className="mx-1.5 text-lg text-slate-500">:</span>
                    <span>{football.scoreB}</span>
                  </div>

                  <div className="flex min-w-[75px] items-center justify-center gap-1 bg-[#00081a] px-4 font-broadcast text-2xl font-black text-white">
                    {football.redCardsB > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-rose-600" />}
                    <span>{teamBCode}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-[#000f2e] px-4 text-xs font-bold text-slate-300">
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">{football.half}</span>
                    <span className="font-score text-base text-white">{footballClock.display}'</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* THEME 3: FIFA WORLD CUP */}
            {activeTheme === "fifa" && (
              <motion.div
                key="theme-fifa"
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                className="fixed top-8 left-8"
              >
                <div className="flex h-[56px] items-stretch overflow-hidden rounded-xl border border-white/20 bg-[#8a1538] shadow-[0_12px_35px_rgba(0,0,0,0.8)]">
                  <div className="flex min-w-[80px] items-center justify-center gap-1.5 bg-[#5c0d24] px-4 font-broadcast text-2xl font-black text-white">
                    <span>{teamACode}</span>
                    {football.redCardsA > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-rose-500" />}
                  </div>

                  <div className="flex items-center justify-center bg-white px-5 font-score text-3xl font-black text-[#8a1538]">
                    {football.scoreA} - {football.scoreB}
                  </div>

                  <div className="flex min-w-[80px] items-center justify-center gap-1.5 bg-[#5c0d24] px-4 font-broadcast text-2xl font-black text-white">
                    {football.redCardsB > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-rose-500" />}
                    <span>{teamBCode}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-[#8a1538] px-4 text-white border-l border-white/10">
                    <span className="text-[9px] font-black uppercase text-rose-200 tracking-wider">{football.half}</span>
                    <span className="font-score text-base font-bold">{footballClock.display}'</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* THEME 4: LA LIGA CYBER (Fixed Red Card Indicators) */}
            {activeTheme === "laliga" && (
              <motion.div
                key="theme-laliga"
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                className="fixed top-8 left-8"
              >
                <div className="flex h-[56px] items-stretch border-2 border-[#ff3b4e] bg-[#0c0d12] shadow-[0_0_30px_rgba(255,59,78,0.3)] rounded-lg overflow-hidden">
                  <div className="flex min-w-[75px] items-center justify-center gap-1.5 bg-[#ff3b4e] px-4 font-broadcast text-2xl font-black text-white">
                    <span>{teamACode}</span>
                    {football.redCardsA > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-slate-950 border border-white/40" />}
                  </div>

                  <div className="flex items-center justify-center px-5 font-score text-3xl font-black text-white">
                    {football.scoreA} : {football.scoreB}
                  </div>

                  <div className="flex min-w-[75px] items-center justify-center gap-1.5 bg-[#1a1c24] px-4 font-broadcast text-2xl font-black text-slate-300">
                    {football.redCardsB > 0 && <span className="h-3.5 w-2.5 rounded-[2px] bg-rose-600" />}
                    <span>{teamBCode}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-[#0c0d12] px-4 border-l border-slate-800">
                    <span className="text-[9px] font-black uppercase text-[#ff3b4e] tracking-wider">{football.half}</span>
                    <span className="font-score text-base font-bold text-white">{footballClock.display}'</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* THEME 5: CLASSIC TOP-CENTER */}
            {activeTheme === "classic" && (
              <motion.div
                key="theme-classic"
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -80, opacity: 0 }}
                className="fixed top-8 left-0 right-0 flex justify-center"
              >
                <div className="flex h-[56px] items-stretch overflow-hidden rounded-full border border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-2 px-6 font-broadcast text-2xl font-bold uppercase text-white">
                    <span>{meta.teamA}</span>
                    {football.redCardsA > 0 && <span className="h-3 w-2 rounded-[2px] bg-rose-600" />}
                  </div>

                  <div className="flex items-center bg-emerald-600 px-6 font-score text-4xl font-black text-white">
                    {football.scoreA} - {football.scoreB}
                  </div>

                  <div className="flex items-center gap-2 px-6 font-broadcast text-2xl font-bold uppercase text-white">
                    {football.redCardsB > 0 && <span className="h-3 w-2 rounded-[2px] bg-rose-600" />}
                    <span>{meta.teamB}</span>
                  </div>

                  <div className="flex flex-col justify-center bg-slate-900 px-5 text-emerald-400">
                    <span className="text-[9px] font-black uppercase text-slate-400">{football.half}</span>
                    <span className="font-score text-base font-bold">{footballClock.display}'</span>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}