"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { safeArray } from "@/lib/utils";
import type { Batsman, Bowler } from "@/lib/types/match";
import { Trophy, Award } from "lucide-react";

interface Props {
  theme?: string;
}

const getShortName = (name?: string, fallback = "TM") => {
  if (!name) return fallback;
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
};

export default function BroadcastEngine({ theme = "sky" }: Props) {
  const { matchData, loading } = useMatchData();

  if (loading || !matchData?.meta || matchData.meta.showScoreboard === false) return null;

  const { meta, cricket } = matchData;
  const activeGraphic = meta.activeGraphic || "LOWER_THIRD";
  const activeTheme = theme || meta.activeTheme || "sky";

  const isSecondInnings = cricket?.currentInnings === 2;
  const innings = isSecondInnings ? cricket?.innings2 : cricket?.innings1;
  const target = innings?.target;

  const battingTeamName = innings?.battingTeam === "teamA" ? meta.teamA : meta.teamB;
  const bowlingTeamName = innings?.battingTeam === "teamA" ? meta.teamB : meta.teamA;

  const battingCode = getShortName(battingTeamName, "BAT");
  const bowlingCode = getShortName(bowlingTeamName, "BWL");

  // ১ম ও ২য় ইনিংসের টিম নাম ও ডেটা
  const inn1 = cricket?.innings1;
  const inn2 = cricket?.innings2;
  const inn1BattingTeam = inn1?.battingTeam === "teamA" ? meta.teamA : meta.teamB;
  const inn1BowlingTeam = inn1?.battingTeam === "teamA" ? meta.teamB : meta.teamA;

  // ১ম ইনিংসের ডায়নামিক CRR ক্যালকুলেশন
  const [inn1Overs, inn1Balls] = (inn1?.overs || "0.0").split(".").map(Number);
  const totalBallsInn1 = (inn1Overs || 0) * 6 + (inn1Balls || 0);
  const inn1CRR = totalBallsInn1 > 0 ? (((inn1?.score || 0) / totalBallsInn1) * 6).toFixed(2) : "0.00";

  // ২য় ইনিংসে Required Run Rate
  const maxOvers = cricket?.maxOvers || 20;
  const targetScore = (inn1?.score || 0) + 1;
  const rrr = ((targetScore / maxOvers)).toFixed(2);

  // রেজাল্ট স্টেটমেন্ট জেনারেশন (Result Calculation)
  const getMatchResultText = () => {
    if (!inn1 || !inn2) return "MATCH COMPLETED";
    
    // চেজিং টিম টার্গেট পার করলে
    if (inn2.score >= targetScore) {
      const wicketsLeft = 10 - inn2.wickets;
      return `${inn1BowlingTeam.toUpperCase()} WON BY ${wicketsLeft} WICKET${wicketsLeft > 1 ? "S" : ""}`;
    }
    
    // ডিফেন্ডিং টিম জিতলে
    if (inn2.isCompleted || (inn2.overs.endsWith(".0") && Number(inn2.overs.split(".")[0]) >= maxOvers) || inn2.wickets >= 10) {
      const runMargin = inn1.score - inn2.score;
      if (runMargin > 0) {
        return `${inn1BattingTeam.toUpperCase()} WON BY ${runMargin} RUN${runMargin > 1 ? "S" : ""}`;
      }
      if (runMargin === 0) {
        return "MATCH TIED (SUPER OVER REQUIRED)";
      }
    }

    return `${inn1BowlingTeam.toUpperCase()} NEED ${Math.max(targetScore - inn2.score, 0)} RUNS`;
  };

  const batsmen = safeArray<Batsman>(innings?.batsmen);
  const bowlers = safeArray<Bowler>(innings?.bowlers);

  const striker = batsmen.find((b) => b.onStrike && !b.isOut) || batsmen[0];
  const nonStriker = batsmen.find((b) => !b.onStrike && !b.isOut) || batsmen[1];
  const activeBowler = bowlers.find((b) => b.isActive) || bowlers[0];

  const [oversCount, ballsCount] = (innings?.overs || "0.0").split(".").map(Number);
  const totalBalls = (oversCount || 0) * 6 + (ballsCount || 0);
  const crr = totalBalls > 0 ? (((innings?.score || 0) / totalBalls) * 6).toFixed(2) : "0.00";

  const totalFours = batsmen.reduce((sum, b) => sum + (b.fours || 0), 0);
  const totalSixes = batsmen.reduce((sum, b) => sum + (b.sixes || 0), 0);

  const recentBallsRaw = innings?.recentBalls || [];
  const currentOverBalls = recentBallsRaw.slice(-(ballsCount === 0 && totalBalls > 0 ? 6 : ballsCount || 6));

  const renderBallCircle = (ball: any, idx: number, isDark = true) => {
    const label = typeof ball === "object" ? ball.label : String(ball);
    let style = isDark ? "border-slate-600 bg-slate-800/80 text-white" : "border-slate-300 bg-slate-200 text-slate-800";
    let text = label;

    if (label === "0" || label === "•" || label === "⊙") {
      style = isDark ? "border-slate-700 bg-slate-900/60 text-slate-400" : "border-slate-300 bg-slate-100 text-slate-400";
      text = "⊙";
    } else if (label === "4") {
      style = "border-sky-400 bg-sky-500 text-white font-black";
    } else if (label === "6") {
      style = "border-amber-400 bg-amber-500 text-slate-950 font-black";
    } else if (label === "W") {
      style = "border-rose-500 bg-rose-600 text-white font-black";
    }

    return (
      <span key={idx} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${style}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 font-sans select-none">
      <AnimatePresence mode="wait">
        {/* ================= ১. ইনফরমেটিভ INNINGS BREAK POSTER ================= */}
        {activeGraphic === "INNINGS_BREAK" && (
          <motion.div
            key="innings-break-poster"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-6 backdrop-blur-md"
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-amber-400 bg-slate-950/95 p-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.95)]">
              <div className="mb-3 inline-block rounded-full bg-amber-400/20 px-5 py-1 font-broadcast text-xs font-black uppercase tracking-widest text-amber-400">
                INNINGS BREAK
              </div>
              
              <h2 className="mb-5 text-2xl font-black text-white sm:text-3xl">
                {meta.teamA} <span className="text-amber-400">VS</span> {meta.teamB}
              </h2>

              {/* 1st Innings Batting Summary Box */}
              <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {inn1BattingTeam} (1st Innings Total)
                </div>
                
                <div className="my-2 font-score text-7xl font-black text-white">
                  {inn1?.score || 0} <span className="text-4xl text-slate-500">/</span> {inn1?.wickets || 0}
                </div>

                <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-300">
                  <span>Overs: <strong className="text-white">{inn1?.overs || "0.0"}</strong> ({maxOvers} Ov)</span>
                  <span className="text-slate-600">•</span>
                  <span>CRR: <strong className="text-emerald-400">{inn1CRR}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>Extras: <strong className="text-amber-400">
                    {(inn1?.extras?.wide || 0) + (inn1?.extras?.noBall || 0) + (inn1?.extras?.bye || 0) + (inn1?.extras?.legBye || 0)}
                  </strong></span>
                </div>
              </div>

              {/* Chasing Equation / Target */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target for <span className="text-emerald-400">{inn1BowlingTeam}</span>
                </div>
                <div className="font-score text-4xl font-black text-emerald-400">
                  {targetScore} RUNS
                </div>
                <div className="text-xs font-medium text-slate-400 mt-1">
                  Required Run Rate: <strong className="text-white">{rrr}</strong> runs per over
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= ২. ব্রডকাস্ট RESULT POSTER (CHAMPIONS CARD) ================= */}
        {activeGraphic === "RESULT_POSTER" && (
          <motion.div
            key="result-poster"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-6 backdrop-blur-xl"
          >
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border-4 border-amber-400 bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 p-8 text-center shadow-[0_0_80px_rgba(251,191,36,0.4)]">
              {/* Top Victory Ribbon */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/20 px-6 py-1.5 font-broadcast text-sm font-black uppercase tracking-widest text-amber-400">
                <Trophy size={18} /> OFFICIAL MATCH RESULT
              </div>

              {/* Result Headline */}
              <h1 className="mb-6 font-score text-4xl font-black tracking-wider text-white sm:text-5xl drop-shadow-md">
                {getMatchResultText()}
              </h1>

              {/* Innings 1 vs Innings 2 Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{inn1BattingTeam}</div>
                  <div className="font-score text-4xl font-black text-amber-400 my-1">
                    {inn1?.score}/{inn1?.wickets}
                  </div>
                  <div className="text-xs text-slate-400">
                    Overs: <strong className="text-white">{inn1?.overs}</strong> (CRR: {inn1CRR})
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{inn1BowlingTeam}</div>
                  <div className="font-score text-4xl font-black text-sky-400 my-1">
                    {inn2 ? `${inn2.score}/${inn2.wickets}` : "Did not bat"}
                  </div>
                  <div className="text-xs text-slate-400">
                    Overs: <strong className="text-white">{inn2?.overs || "0.0"}</strong> (Target: {targetScore})
                  </div>
                </div>
              </div>

              <div className="font-broadcast text-xs font-extrabold uppercase tracking-widest text-slate-500">
                {meta.tournament || "SPORTS BROADCAST SERIES"} • {meta.venue || "MATCH CENTER"}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= ৩. অন্যান্য পপআপ (Batter, Bowler, Partnership, Summary) ================= */}
        {activeGraphic === "BATSMAN_CARD" && striker && (
          <motion.div
            key="batsman-card"
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex h-[72px] items-stretch overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-slate-950/95 shadow-[0_15px_45px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <div className="flex items-center bg-amber-400 px-6 font-broadcast text-xl font-black uppercase text-slate-950">
                BATTER
              </div>
              <div className="flex items-center gap-8 px-8 py-2">
                <div>
                  <div className="font-broadcast text-2xl font-black text-white">{striker.name}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Current Striker</div>
                </div>
                <div className="flex items-baseline gap-1.5 font-score text-4xl text-amber-400">
                  {striker.runs} <span className="font-sans text-base text-slate-400">({striker.balls})</span>
                </div>
                <div className="border-l border-slate-700 pl-6 text-sm font-semibold text-slate-300">
                  <div>4s: <span className="font-bold text-white">{striker.fours || 0}</span></div>
                  <div>6s: <span className="font-bold text-white">{striker.sixes || 0}</span></div>
                </div>
                <div className="border-l border-slate-700 pl-6 text-sm font-semibold text-slate-300">
                  SR: <span className="font-bold text-emerald-400">
                    {striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : "0.0"}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeGraphic === "BOWLER_CARD" && activeBowler && (
          <motion.div
            key="bowler-card"
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex h-[72px] items-stretch overflow-hidden rounded-2xl border-2 border-emerald-400/80 bg-slate-950/95 shadow-[0_15px_45px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <div className="flex items-center bg-emerald-400 px-6 font-broadcast text-xl font-black uppercase text-slate-950">
                BOWLER
              </div>
              <div className="flex items-center gap-8 px-8 py-2">
                <div>
                  <div className="font-broadcast text-2xl font-black text-white">{activeBowler.name}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Bowling Spell</div>
                </div>
                <div className="font-score text-4xl text-emerald-400">
                  {activeBowler.wickets}-{activeBowler.runs}
                </div>
                <div className="border-l border-slate-700 pl-6 text-sm font-semibold text-slate-300">
                  <div>Overs: <span className="font-bold text-white">{activeBowler.overs}</span></div>
                  <div>Maidens: <span className="font-bold text-white">{activeBowler.maidens}</span></div>
                </div>
                <div className="border-l border-slate-700 pl-6 text-sm font-semibold text-slate-300">
                  Econ: <span className="font-bold text-amber-400">
  {(() => {
    const [bO, bB] = (activeBowler.overs || "0.0").split(".").map(Number);
    const bTotal = (bO || 0) + (bB || 0) / 6;
    return bTotal > 0 ? (activeBowler.runs / bTotal).toFixed(2) : "0.00";
  })()}
</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeGraphic === "PARTNERSHIP_CARD" && striker && nonStriker && (
          <motion.div
            key="partnership-card"
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex h-[72px] items-stretch overflow-hidden rounded-2xl border-2 border-amber-400 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
              <div className="bg-amber-400 px-6 font-broadcast text-xl font-black uppercase text-slate-950 flex items-center">
                PARTNERSHIP
              </div>
              <div className="flex items-center gap-8 px-8 py-2">
                <div className="text-right">
                  <div className="text-base font-bold text-white">{striker.name}</div>
                  <div className="text-xs text-amber-400 font-mono font-bold">{striker.runs} ({striker.balls})</div>
                </div>
                <div className="font-score text-4xl text-white">
                  {striker.runs + nonStriker.runs} <span className="text-xs font-sans text-slate-400 font-normal">RUNS</span>
                </div>
                <div className="text-left">
                  <div className="text-base font-bold text-white">{nonStriker.name}</div>
                  <div className="text-xs text-amber-400 font-mono font-bold">{nonStriker.runs} ({nonStriker.balls})</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeGraphic === "MATCH_SUMMARY" && (
          <motion.div
            key="match-summary-card"
            initial={{ y: 150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex h-[72px] items-stretch overflow-hidden rounded-2xl border-2 border-sky-400 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
              <div className="bg-sky-500 px-6 font-broadcast text-xl font-black uppercase text-white flex items-center">
                MATCH SUMMARY
              </div>
              <div className="flex items-center gap-8 px-8 py-2">
                <div>
                  <div className="font-broadcast text-xl font-black text-white">{battingTeamName}</div>
                  <div className="font-score text-2xl text-amber-400">
                    {innings?.score}/{innings?.wickets} <span className="font-sans text-xs text-slate-400">({innings?.overs} ov)</span>
                  </div>
                </div>
                <div className="border-l border-slate-700 pl-6">
                  <div className="text-xs text-slate-400 font-bold uppercase">Run Rate</div>
                  <div className="font-score text-2xl text-emerald-400">CRR {crr}</div>
                </div>
                <div className="border-l border-slate-700 pl-6">
                  <div className="text-xs text-slate-400 font-bold uppercase">Boundaries</div>
                  <div className="font-bold text-white text-sm">{totalFours} Fours | {totalSixes} Sixes</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= ৪. রেগুলার LOWER_THIRD ৫টি থিম ================= */}
        {activeGraphic === "LOWER_THIRD" && (
          <>
            {/* THEME 1: SONY / SKY / PCB PRO SERIES */}
            {activeTheme === "sky" && (
              <motion.div
                key="theme-sky"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-6"
              >
                <div className="flex h-[68px] w-full max-w-7xl items-stretch overflow-hidden rounded-2xl border border-slate-800 bg-[#0c1424] shadow-[0_15px_45px_rgba(0,0,0,0.9)]">
                  <div className="flex min-w-[85px] items-center justify-center bg-[#070b14] px-5 font-broadcast text-3xl font-black tracking-wider text-white">
                    {battingCode}
                  </div>
                  <div className={`flex min-w-[165px] flex-col justify-center px-5 ${isSecondInnings ? "bg-[#8b8b1a] text-slate-950" : "bg-[#d91b83] text-white"}`}>
                    <div className="font-score text-4xl leading-none font-bold tracking-tight">{innings?.score}-{innings?.wickets}</div>
                    <div className="mt-0.5 text-xs font-bold opacity-90">({innings?.overs} ov)</div>
                  </div>
                  <div className="flex min-w-[240px] flex-col justify-center border-r border-slate-800 bg-[#0f172a] px-5 py-1 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="truncate font-bold uppercase text-white">{striker?.name}<span className="ml-0.5 text-amber-400">*</span></span>
                      <span className="font-mono font-bold text-white">{striker?.runs} <span className="text-xs text-slate-400 font-normal">({striker?.balls})</span></span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-400">
                      <span className="truncate font-medium uppercase">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-300">{nonStriker?.runs || 0} <span className="text-xs text-slate-500 font-normal">({nonStriker?.balls || 0})</span></span>
                    </div>
                  </div>
                  <div className="flex min-w-[240px] flex-col justify-center bg-[#e2e8f0] px-5 py-1 text-slate-900">
                    <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-600">
                      <span>{isSecondInnings ? "TARGET" : "RUN RATE"}</span>
                      <span>BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between font-bold">
                      <span className="font-score text-2xl text-slate-950">{isSecondInnings ? target : crr}</span>
                      <span className="text-xs font-black text-slate-800">{totalFours} FOURS & {totalSixes} SIXES</span>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-between border-l border-slate-800 bg-[#0f172a] px-6 text-sm">
                    <div>
                      <div className="font-bold uppercase text-white">{activeBowler?.name}</div>
                      <div className="font-mono text-xs font-bold text-emerald-400">{activeBowler?.wickets}-{activeBowler?.runs} <span className="text-slate-400 font-normal">({activeBowler?.overs} ov)</span></div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden pl-4">
                      {currentOverBalls.length > 0 ? currentOverBalls.map((b, i) => renderBallCircle(b, i, true)) : <span className="text-xs text-slate-500">Over starting...</span>}
                    </div>
                  </div>
                  <div className="flex min-w-[85px] items-center justify-center bg-[#070b14] px-5 font-broadcast text-3xl font-black tracking-wider text-slate-300">
                    {bowlingCode}
                  </div>
                </div>
              </motion.div>
            )}

            {/* THEME 2: ULTRA DARK MATRIX */}
            {activeTheme === "dark" && (
              <motion.div
                key="theme-dark"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-6"
              >
                <div className="flex h-[68px] w-full max-w-7xl items-stretch overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-[#06080e] shadow-[0_15px_50px_rgba(0,0,0,0.95)]">
                  <div className="flex min-w-[90px] items-center justify-center bg-[#005f3b] px-5 font-broadcast text-3xl font-black text-white">{battingCode}</div>
                  <div className="flex min-w-[170px] items-center justify-between border-r border-amber-400/80 bg-slate-950 px-5">
                    <div className="font-score text-4xl text-white">{innings?.score}<span className="text-amber-400">/{innings?.wickets}</span></div>
                    <div className="text-right text-xs font-bold text-slate-400">
                      <div>({innings?.overs} ov)</div>
                      <div className="text-amber-400">CRR {crr}</div>
                    </div>
                  </div>
                  <div className="flex min-w-[240px] flex-col justify-center border-r border-slate-800 bg-[#0c1018] px-5 py-1 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 font-bold text-white"><span className="text-amber-400 text-xs">⚡</span>{striker?.name}</span>
                      <span className="font-score text-xl text-amber-400">{striker?.runs} <span className="font-sans text-xs text-slate-400 font-normal">({striker?.balls})</span></span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-400">
                      <span className="truncate font-medium">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-300">{nonStriker?.runs || 0} <span className="text-xs text-slate-500 font-normal">({nonStriker?.balls || 0})</span></span>
                    </div>
                  </div>
                  <div className="flex min-w-[220px] flex-col justify-center border-r border-slate-800 bg-slate-950 px-5 py-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-400">
                      <span>{isSecondInnings ? "TARGET" : "REQ INFO"}</span>
                      <span>BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-score text-2xl text-amber-400">{isSecondInnings ? target : `CRR ${crr}`}</span>
                      <span className="font-bold text-slate-200">{totalFours} 4s & {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-between bg-[#0c1018] px-6 text-sm">
                    <div>
                      <div className="font-bold uppercase text-white">{activeBowler?.name}</div>
                      <div className="font-mono text-xs font-bold text-amber-400">{activeBowler?.wickets}-{activeBowler?.runs} <span className="text-slate-400 font-normal">({activeBowler?.overs} ov)</span></div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden pl-4">{currentOverBalls.map((b, i) => renderBallCircle(b, i, true))}</div>
                  </div>
                  <div className="flex min-w-[85px] items-center justify-center bg-[#0c1018] border-l border-slate-800 px-5 font-broadcast text-3xl font-black text-slate-300">{bowlingCode}</div>
                </div>
              </motion.div>
            )}

            {/* THEME 3: PSL CYBER NEON PODS */}
            {activeTheme === "psl" && (
              <motion.div
                key="theme-psl"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-6"
              >
                <div className="flex h-[68px] w-full max-w-7xl items-stretch overflow-hidden rounded-2xl border-2 border-lime-400 bg-slate-950 shadow-[0_0_35px_rgba(132,204,22,0.35)]">
                  <div className="flex min-w-[90px] items-center justify-center bg-gradient-to-r from-[#84cc16] to-[#a3e635] px-5 font-broadcast text-3xl font-black text-slate-950">{battingCode}</div>
                  <div className="flex min-w-[170px] flex-col justify-center bg-[#0f172a] px-5 border-r border-slate-800 text-white">
                    <div className="font-score text-4xl leading-none text-lime-400 font-bold">{innings?.score}-{innings?.wickets}</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-400">({innings?.overs} ov)</div>
                  </div>
                  <div className="flex min-w-[240px] flex-col justify-center border-r border-slate-800 bg-slate-950 px-5 py-1 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="truncate font-bold text-lime-400">/ {striker?.name}</span>
                      <span className="font-mono font-bold text-white">{striker?.runs} ({striker?.balls})</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-400">
                      <span className="truncate font-medium">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-300">{nonStriker?.runs || 0} ({nonStriker?.balls || 0})</span>
                    </div>
                  </div>
                  <div className="flex min-w-[230px] flex-col justify-center bg-[#0f172a] px-5 py-1 border-r border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-400">
                      <span>{isSecondInnings ? "TARGET" : "RUN RATE"}</span>
                      <span className="text-lime-400">BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between font-bold">
                      <span className="font-score text-2xl text-lime-400">{isSecondInnings ? target : crr}</span>
                      <span className="text-xs text-white">{totalFours} 4s & {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-between bg-slate-950 px-6 text-sm">
                    <div>
                      <div className="font-bold uppercase text-white">{activeBowler?.name}</div>
                      <div className="font-mono text-xs font-bold text-lime-400">{activeBowler?.wickets}-{activeBowler?.runs} <span className="text-slate-400 font-normal">({activeBowler?.overs} ov)</span></div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden pl-4">{currentOverBalls.map((b, i) => renderBallCircle(b, i, true))}</div>
                  </div>
                  <div className="flex min-w-[85px] items-center justify-center bg-[#0f172a] px-5 font-broadcast text-3xl font-black text-lime-400/80">{bowlingCode}</div>
                </div>
              </motion.div>
            )}

            {/* THEME 4: FOX SPORTS */}
            {activeTheme === "fox" && (
              <motion.div
                key="theme-fox"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-6"
              >
                <div className="flex h-[68px] w-full max-w-7xl items-stretch overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-[0_15px_45px_rgba(0,0,0,0.85)] text-slate-900">
                  <div className="flex min-w-[85px] items-center justify-center bg-[#0c2340] px-5 font-broadcast text-3xl font-black text-white">{battingCode}</div>
                  <div className="flex min-w-[170px] items-center justify-center bg-[#0c2340] px-6 text-white [clip-path:polygon(0_0,100%_0,calc(100%-15px)_100%,0_100%)]">
                    <div>
                      <div className="font-score text-4xl leading-none font-bold text-white">{innings?.score}/{innings?.wickets}</div>
                      <div className="mt-0.5 text-xs font-bold text-sky-400">({innings?.overs} ov)</div>
                    </div>
                  </div>
                  <div className="flex min-w-[240px] flex-col justify-center border-r border-slate-300 bg-slate-50 px-5 py-1 text-sm">
                    <div className="flex items-center justify-between gap-4 font-bold text-[#0c2340]">
                      <span className="flex items-center gap-1.5 truncate"><span className="text-blue-600">▶</span> {striker?.name}</span>
                      <span className="font-mono">{striker?.runs} ({striker?.balls})</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-600 pl-4">
                      <span className="truncate font-medium">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-800">{nonStriker?.runs || 0} ({nonStriker?.balls || 0})</span>
                    </div>
                  </div>
                  <div className="flex min-w-[220px] flex-col justify-center bg-slate-200 border-r border-slate-300 px-5 py-1 text-xs text-slate-900">
                    <div className="flex items-center justify-between font-extrabold text-slate-600">
                      <span>{isSecondInnings ? "TARGET" : "RUN RATE"}</span>
                      <span>BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between font-bold">
                      <span className="font-score text-2xl text-[#0c2340]">{isSecondInnings ? target : crr}</span>
                      <span className="text-xs font-black text-slate-800">{totalFours} 4s & {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-between bg-white px-6 text-sm">
                    <div>
                      <div className="font-bold uppercase text-[#0c2340]">{activeBowler?.name}</div>
                      <div className="font-mono text-xs font-bold text-emerald-700">{activeBowler?.wickets}/{activeBowler?.runs} <span className="text-slate-500 font-normal">({activeBowler?.overs} ov)</span></div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden pl-4">{currentOverBalls.map((b, i) => renderBallCircle(b, i, false))}</div>
                  </div>
                  <div className="flex min-w-[85px] items-center justify-center bg-[#0c2340] px-5 font-broadcast text-3xl font-black text-slate-300">{bowlingCode}</div>
                </div>
              </motion.div>
            )}

            {/* THEME 5: IPL NEON CHYRON */}
            {activeTheme === "ipl" && (
              <motion.div
                key="theme-ipl"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-6"
              >
                <div className="chyron flex h-[68px] w-full max-w-7xl items-stretch border-2 border-amber-500/80 bg-slate-950/95 shadow-[0_0_40px_rgba(245,158,11,0.35)] backdrop-blur-xl">
                  <div className="flex min-w-[90px] items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 px-5 font-broadcast text-3xl font-black text-slate-950">{battingCode}</div>
                  <div className="flex min-w-[170px] items-center justify-center border-r border-slate-800 px-5">
                    <div>
                      <div className="font-score text-4xl text-white">{innings?.score}<span className="text-amber-500">/{innings?.wickets}</span></div>
                      <div className="text-xs font-bold text-amber-400">({innings?.overs} ov)</div>
                    </div>
                  </div>
                  <div className="flex min-w-[240px] flex-col justify-center border-r border-slate-800 bg-[#0f172a] px-5 py-1 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="truncate font-bold text-white"><span className="text-amber-400">*</span> {striker?.name}</span>
                      <span className="font-mono font-bold text-amber-400">{striker?.runs} ({striker?.balls})</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-400">
                      <span className="truncate font-medium">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-300">{nonStriker?.runs || 0} ({nonStriker?.balls || 0})</span>
                    </div>
                  </div>
                  <div className="flex min-w-[230px] flex-col justify-center bg-slate-900 border-r border-slate-800 px-5 py-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-400">
                      <span>{isSecondInnings ? "TARGET" : "RUN RATE"}</span>
                      <span className="text-amber-400">BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between font-bold">
                      <span className="font-score text-2xl text-amber-400">{isSecondInnings ? target : crr}</span>
                      <span className="text-xs text-white">{totalFours} 4s & {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 items-center justify-between bg-slate-950 px-6 text-sm">
                    <div>
                      <div className="font-bold uppercase text-white">{activeBowler?.name}</div>
                      <div className="font-mono text-xs font-bold text-emerald-400">{activeBowler?.wickets}-{activeBowler?.runs} <span className="text-slate-400 font-normal">({activeBowler?.overs} ov)</span></div>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden pl-4">{currentOverBalls.map((b, i) => renderBallCircle(b, i, true))}</div>
                  </div>
                  <div className="flex min-w-[85px] items-center justify-center bg-slate-900 px-5 font-broadcast text-3xl font-black text-slate-300">{bowlingCode}</div>
                </div>
              </motion.div>
            )}



            {/* THEME 6: MINIMAL COMPACT BAR (NO PLAYER INFO) */}
{activeTheme === "minimal" && (
  <motion.div
    key="theme-minimal"
    initial={{ y: 80, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    exit={{ y: 80, opacity: 0 }}
    className="fixed bottom-6 left-0 right-0 flex justify-center px-6"
  >
    <div className="relative flex h-[76px] w-full max-w-6xl items-center justify-between overflow-hidden rounded-2xl border border-slate-800/90 bg-[#080c16]/95 px-6 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-xl">
      {/* Top Multi-Color Glowing Accent Line */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-400" />

      {/* 1. Left: Bat Icon + Team vs Team + Tournament Name */}
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-600/20 text-xl shadow-inner">
          🏏
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-broadcast text-2xl font-black uppercase tracking-wide text-white">
              {battingTeamName}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              vs {bowlingTeamName}
            </span>
          </div>
          <div className="text-[11px] font-bold tracking-wider text-slate-400">
            {meta.tournament || "Local Tournament"}
          </div>
        </div>
      </div>

      {/* 2. Center: Large Score + Overs / CRR */}
      <div className="flex items-center gap-5">
        <div className="font-score text-5xl font-black tracking-tight text-amber-400">
          {innings?.score || 0}
          <span className="mx-0.5 text-3xl font-bold text-slate-500">/</span>
          {innings?.wickets || 0}
        </div>

        <div className="border-l border-slate-800 py-1 pl-4">
          <div className="text-sm font-bold text-white">
            {innings?.overs || "0.0"}{" "}
            <span className="text-xs font-normal text-slate-400">/ {maxOvers} ov</span>
          </div>
          <div className="font-mono text-[11px] font-bold text-slate-400">
            CRR: <span className="text-emerald-400">{crr}</span>
          </div>
        </div>
      </div>

      {/* 3. Right: Dynamic Target Badge + This Over Deliveries + Boundaries */}
      <div className="flex flex-col items-end gap-1.5">
        {/* Target / Inning Status Pill */}
        <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-0.5 text-[11px] font-bold text-sky-300 shadow-sm">
          {isSecondInnings && target ? (
            <span>
              Target: <strong className="text-white">{target}</strong> (Need{" "}
              <strong className="text-amber-400">{Math.max(0, target - (innings?.score || 0))}</strong> off{" "}
              <strong className="text-white">{Math.max(0, maxOvers * 6 - totalBalls)}b</strong>)
            </span>
          ) : (
            <span>1st Innings • Target: TBD</span>
          )}
        </div>

        {/* Deliveries in This Over */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            THIS OVER:
          </span>
          <div className="flex items-center gap-1.5">
            {currentOverBalls.length > 0 ? (
              currentOverBalls.map((b, i) => renderBallCircle(b, i, true))
            ) : (
              <span className="text-[11px] text-slate-400">Over starting...</span>
            )}
          </div>
          <div className="hidden border-l border-slate-800 pl-2.5 text-[10px] font-bold text-slate-400 sm:block">
            <span className="text-sky-400">{totalFours}</span> 4s • <span className="text-amber-400">{totalSixes}</span> 6s
          </div>
        </div>
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