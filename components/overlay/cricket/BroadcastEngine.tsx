// components/overlay/cricket/BroadcastEngine.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { 
  safeArray, 
  getShortName, 
  calculateCRR, 
  calculateRRR, 
  calculateEconomy, 
  calculateSR, 
  getMaxWickets, 
  oversToDecimal 
} from "@/lib/utils";
import type { Batsman, Bowler } from "@/lib/types/match";
import { Trophy } from "lucide-react";

interface Props {
  matchId?: string;
  theme?: string;
}

// 🛡️ নিখুঁত ওভার ডেলিভারি গণনাকারী (ওয়াইড বা নো-বল কখনোই ড্রপ হবে না)
const getCurrentOverDeliveries = (recentBalls: any[], overs: string): any[] => {
  if (!recentBalls || recentBalls.length === 0) return [];
  const parts = (overs || "0.0").split(".");
  const completedOvers = Number(parts[0] || 0);
  const currentBalls = Number(parts[1] || 0);

  if (completedOvers === 0 && currentBalls === 0) return [];

  const targetLegalBalls = currentBalls === 0 ? 6 : currentBalls;
  const deliveries: any[] = [];
  let legalCount = 0;

  for (let i = recentBalls.length - 1; i >= 0; i--) {
    const ball = recentBalls[i];
    deliveries.unshift(ball);

    const isLegal = typeof ball === "object" && ball !== null
      ? !ball.isExtra || ball.extraType === "Bye" || ball.extraType === "Leg Bye"
      : !String(ball).includes("Wd") && !String(ball).includes("Nb");

    if (isLegal) {
      legalCount++;
      if (legalCount >= targetLegalBalls) {
        break;
      }
    }
  }

  return deliveries;
};

export default function BroadcastEngine({ matchId, theme = "sky" }: Props) {
  const { matchData, loading } = useMatchData(matchId);
  const [activeTransientGraphic, setActiveTransientGraphic] = useState<string | null>(null);

  const { meta, cricket } = matchData || {};
  const activeGraphic = meta?.activeGraphic || "LOWER_THIRD";
  const activeTheme = theme || meta?.activeTheme || "sky";

  // 🛡️ ১২ সেকেন্ডের অটো-রিভার্ট স্পটলাইট গার্ড
  useEffect(() => {
    if (["BATSMAN_CARD", "BOWLER_CARD", "PARTNERSHIP_CARD", "MATCH_SUMMARY"].includes(activeGraphic)) {
      setActiveTransientGraphic(activeGraphic);
      const timer = setTimeout(() => {
        setActiveTransientGraphic(null);
      }, 12000);
      return () => clearTimeout(timer);
    } else {
      setActiveTransientGraphic(null);
    }
  }, [activeGraphic, meta?.updatedAt]);

  if (loading || !matchData?.meta) return null;

  const currentDisplayedGraphic = activeTransientGraphic || (activeGraphic === "RESULT_POSTER" || activeGraphic === "INNINGS_BREAK" ? activeGraphic : "LOWER_THIRD");

  const isScoreboardVisible = meta?.showScoreboard !== false;
  if (!isScoreboardVisible && currentDisplayedGraphic === "LOWER_THIRD") return null;

  const isSecondInnings = cricket?.currentInnings === 2;
  const innings = isSecondInnings ? cricket?.innings2 : cricket?.innings1;
  const inn1 = cricket?.innings1;
  const inn2 = cricket?.innings2;

  const targetScore = innings?.target || inn2?.target || (inn1?.score || 0) + 1;

  const battingTeamName = innings?.battingTeam === "teamA" ? meta?.teamA : meta?.teamB;
  const bowlingTeamName = innings?.battingTeam === "teamA" ? meta?.teamB : meta?.teamA;

  const battingCode = getShortName(battingTeamName, "BAT");
  const bowlingCode = getShortName(bowlingTeamName, "BWL");

  const inn1BattingTeam = inn1?.battingTeam === "teamA" ? meta?.teamA : meta?.teamB;
  const inn1BowlingTeam = inn1?.battingTeam === "teamA" ? meta?.teamB : meta?.teamA;

  const inn1CRR = calculateCRR(inn1?.score || 0, inn1?.overs || "0.0");
  const maxOvers = cricket?.maxOvers || 20;
  const rrr = calculateRRR(targetScore, inn2?.score || 0, maxOvers, inn2?.overs || "0.0");

  const chasingSquadKey: "teamA" | "teamB" =
    (inn2?.battingTeam as "teamA" | "teamB") || (inn1?.battingTeam === "teamA" ? "teamB" : "teamA");
  const squadLength = cricket?.squads?.[chasingSquadKey]?.length || 11;
  const maxWickets = getMaxWickets(squadLength);

  const getMatchResultText = () => {
    if (!inn1 || !inn2) return "MATCH COMPLETED";

    if (inn2.score >= targetScore) {
      const wicketsLeft = Math.max(0, maxWickets - (inn2.wickets || 0));
      return `${inn1BowlingTeam?.toUpperCase()} WON BY ${wicketsLeft} WICKET${wicketsLeft > 1 ? "S" : ""}`;
    }

    const oversDec = oversToDecimal(inn2.overs);
    const isInn2Finished = inn2.isCompleted || oversDec >= maxOvers || (inn2.wickets || 0) >= maxWickets;

    if (isInn2Finished) {
      const runMargin = Math.max(0, targetScore - 1 - inn2.score);
      if (runMargin > 0) {
        return `${inn1BattingTeam?.toUpperCase()} WON BY ${runMargin} RUN${runMargin > 1 ? "S" : ""}`;
      }
      if (runMargin === 0) {
        return "MATCH TIED (SUPER OVER REQUIRED)";
      }
    }

    return `${inn1BowlingTeam?.toUpperCase()} NEED ${Math.max(targetScore - inn2.score, 0)} RUNS`;
  };

  const batsmen = safeArray<Batsman>(innings?.batsmen);
  const bowlers = safeArray<Bowler>(innings?.bowlers);

  const activeBatsmenList = batsmen.filter((b) => !b.isOut);
  const striker = activeBatsmenList.find((b) => b.onStrike) || activeBatsmenList[0] || {
    id: "empty-striker",
    name: "Batsman",
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    onStrike: true,
    isOut: false,
  };

  const nonStriker = activeBatsmenList.find((b) => b.id !== striker.id) || null;

  const activeBowler = bowlers.find((b) => b.isActive) || bowlers[0] || {
    id: "empty-bowler",
    name: "Bowler",
    overs: "0.0",
    maidens: 0,
    runs: 0,
    wickets: 0,
    isActive: true,
  };

  const crr = calculateCRR(innings?.score || 0, innings?.overs || "0.0");
  const totalFours = batsmen.reduce((sum, b) => sum + (b.fours || 0), 0);
  const totalSixes = batsmen.reduce((sum, b) => sum + (b.sixes || 0), 0);

  const currentOverBalls = getCurrentOverDeliveries(innings?.recentBalls || [], innings?.overs || "0.0");

  const renderBallCircle = (ball: any, idx: number, isDark = true) => {
    const label = String(typeof ball === "object" ? ball?.label ?? "" : ball ?? "");
    let style = isDark ? "border-slate-700 bg-slate-900 text-white" : "border-slate-300 bg-slate-200 text-slate-800";
    let text = label;

    if (label === "0" || label === "•" || label === "⊙") {
      style = isDark ? "border-slate-800 bg-slate-950 text-slate-500" : "border-slate-300 bg-slate-100 text-slate-400";
      text = "•";
    } else if (label === "4") {
      style = "border-sky-400 bg-sky-500 text-white font-black";
    } else if (label === "6") {
      style = "border-amber-400 bg-amber-500 text-slate-950 font-black";
    } else if (label === "W") {
      style = "border-rose-500 bg-rose-600 text-white font-black";
    } else if (label.includes("Wd") || label.includes("Nb")) {
      style = "border-purple-400 bg-purple-600 text-white font-black";
    }

    return (
      <span key={idx} className={`flex h-5 min-w-[20px] px-1 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${style}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-30 font-sans select-none [transform:translateZ(0)]">
      <AnimatePresence mode="wait">
        {/* INNINGS BREAK POSTER */}
        {currentDisplayedGraphic === "INNINGS_BREAK" && (
          <motion.div
            key="innings-break-poster"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-6 backdrop-blur-md"
          >
            <div className="w-full max-w-xl overflow-hidden rounded-3xl border-2 border-amber-400 bg-slate-950/95 p-6 text-center shadow-[0_0_50px_rgba(0,0,0,0.95)]">
              <div className="mb-2 inline-block rounded-full bg-amber-400/20 px-4 py-0.5 font-broadcast text-[11px] font-black uppercase tracking-widest text-amber-400">
                INNINGS BREAK
              </div>

              <h2 className="mb-4 text-xl font-black text-white sm:text-2xl">
                {meta?.teamA} <span className="text-amber-400">VS</span> {meta?.teamB}
              </h2>

              <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  {inn1BattingTeam} (1st Innings Total)
                </div>

                <div className="my-1 font-score text-5xl font-black text-white">
                  {inn1?.score || 0} <span className="text-2xl text-slate-500">/</span> {inn1?.wickets || 0}
                </div>

                <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-300">
                  <span>Overs: <strong className="text-white">{inn1?.overs || "0.0"}</strong> ({maxOvers} Ov)</span>
                  <span className="text-slate-600">•</span>
                  <span>CRR: <strong className="text-emerald-400">{inn1CRR}</strong></span>
                  <span className="text-slate-600">•</span>
                  <span>
                    Extras:{" "}
                    <strong className="text-amber-400">
                      {(inn1?.extras?.wide || 0) + (inn1?.extras?.noBall || 0) + (inn1?.extras?.bye || 0) + (inn1?.extras?.legBye || 0)}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-3 text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target for <span className="text-emerald-400">{inn1BowlingTeam}</span>
                </div>
                <div className="font-score text-3xl font-black text-emerald-400">
                  {targetScore} RUNS
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Required Run Rate: <strong className="text-white">{rrr}</strong> runs per over
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* RESULT POSTER */}
        {currentDisplayedGraphic === "RESULT_POSTER" && (
          <motion.div
            key="result-poster"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-6 backdrop-blur-xl"
          >
            <div className="w-full max-w-2xl overflow-hidden rounded-3xl border-2 border-amber-400 bg-slate-950/95 p-6 text-center shadow-[0_0_60px_rgba(251,191,36,0.3)]">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-amber-400/20 px-5 py-1 font-broadcast text-xs font-black uppercase tracking-widest text-amber-400">
                <Trophy size={15} /> OFFICIAL MATCH RESULT
              </div>

              <h1 className="mb-4 font-score text-3xl font-black tracking-wider text-white sm:text-4xl drop-shadow-md">
                {getMatchResultText()}
              </h1>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left">
                  <div className="text-[10px] font-bold uppercase text-slate-400">{inn1BattingTeam}</div>
                  <div className="font-score text-3xl font-black text-amber-400 my-0.5">
                    {inn1?.score}/{inn1?.wickets}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Overs: <strong className="text-white">{inn1?.overs}</strong> (CRR: {inn1CRR})
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left">
                  <div className="text-[10px] font-bold uppercase text-slate-400">{inn1BowlingTeam}</div>
                  <div className="font-score text-3xl font-black text-sky-400 my-0.5">
                    {inn2 && (inn2.score > 0 || inn2.overs !== "0.0") ? `${inn2.score}/${inn2.wickets}` : "Yet to bat"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Overs: <strong className="text-white">{inn2?.overs || "0.0"}</strong> (Target: {targetScore})
                  </div>
                </div>
              </div>

              <div className="font-broadcast text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                {meta?.tournament || "SPORTS BROADCAST SERIES"} • {meta?.venue || "MATCH CENTER"}
              </div>
            </div>
          </motion.div>
        )}

        {/* BATTER SPOTLIGHT */}
        {currentDisplayedGraphic === "BATSMAN_CARD" && striker && (
          <motion.div
            key="batsman-card"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="flex h-[56px] items-stretch overflow-hidden rounded-xl border border-amber-400 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center bg-amber-400 px-4 font-broadcast text-base font-black uppercase text-slate-950">
                BATTER
              </div>
              <div className="flex items-center gap-6 px-6 py-1">
                <div>
                  <div className="font-broadcast text-lg font-black text-white">{striker.name}</div>
                  <div className="text-[10px] font-bold uppercase text-amber-400">Current Striker</div>
                </div>
                <div className="flex items-baseline gap-1 font-score text-3xl text-amber-400">
                  {striker.runs} <span className="font-sans text-xs text-slate-400 font-normal">({striker.balls})</span>
                </div>
                <div className="border-l border-slate-800 pl-4 text-xs font-semibold text-slate-300">
                  <div>4s: <span className="font-bold text-white">{striker.fours || 0}</span> • 6s: <span className="font-bold text-white">{striker.sixes || 0}</span></div>
                  <div>SR: <span className="font-bold text-emerald-400">{calculateSR(striker.runs, striker.balls)}</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* BOWLER SPOTLIGHT */}
        {currentDisplayedGraphic === "BOWLER_CARD" && activeBowler && (
          <motion.div
            key="bowler-card"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="flex h-[56px] items-stretch overflow-hidden rounded-xl border border-emerald-400 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center bg-emerald-400 px-4 font-broadcast text-base font-black uppercase text-slate-950">
                BOWLER
              </div>
              <div className="flex items-center gap-6 px-6 py-1">
                <div>
                  <div className="font-broadcast text-lg font-black text-white">{activeBowler.name}</div>
                  <div className="text-[10px] font-bold uppercase text-emerald-400">Bowling Spell</div>
                </div>
                <div className="font-score text-3xl text-emerald-400">
                  {activeBowler.wickets}-{activeBowler.runs}
                </div>
                <div className="border-l border-slate-800 pl-4 text-xs font-semibold text-slate-300">
                  <div>Overs: <span className="font-bold text-white">{activeBowler.overs}</span> • Maidens: <span className="font-bold text-white">{activeBowler.maidens}</span></div>
                  <div>Econ: <span className="font-bold text-amber-400">{calculateEconomy(activeBowler.runs, activeBowler.overs)}</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PARTNERSHIP SPOTLIGHT */}
        {currentDisplayedGraphic === "PARTNERSHIP_CARD" && striker && nonStriker && (
          <motion.div
            key="partnership-card"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="flex h-[56px] items-stretch overflow-hidden rounded-xl border border-amber-400 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
              <div className="bg-amber-400 px-4 font-broadcast text-base font-black uppercase text-slate-950 flex items-center">
                PARTNERSHIP
              </div>
              <div className="flex items-center gap-6 px-6 py-1">
                <div className="text-right">
                  <div className="text-xs font-bold text-white">{striker.name}</div>
                  <div className="text-[10px] text-amber-400 font-mono">{striker.runs} ({striker.balls})</div>
                </div>
                <div className="font-score text-3xl text-white">
                  {striker.runs + nonStriker.runs} <span className="text-[10px] font-sans text-slate-400 font-normal">RUNS</span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">{nonStriker.name}</div>
                  <div className="text-[10px] text-amber-400 font-mono">{nonStriker.runs} ({nonStriker.balls})</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MATCH SUMMARY SPOTLIGHT */}
        {currentDisplayedGraphic === "MATCH_SUMMARY" && (
          <motion.div
            key="match-summary-card"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2"
          >
            <div className="flex h-[56px] items-stretch overflow-hidden rounded-xl border border-sky-400 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
              <div className="bg-sky-500 px-4 font-broadcast text-base font-black uppercase text-white flex items-center">
                MATCH SUMMARY
              </div>
              <div className="flex items-center gap-6 px-6 py-1">
                <div>
                  <div className="font-broadcast text-lg font-black text-white">{battingTeamName}</div>
                  <div className="font-score text-2xl text-amber-400">
                    {innings?.score}/{innings?.wickets} <span className="font-sans text-xs text-slate-400">({innings?.overs} ov)</span>
                  </div>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Run Rate</div>
                  <div className="font-score text-xl text-emerald-400">CRR {crr}</div>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Boundaries</div>
                  <div className="font-bold text-white text-xs">{totalFours} Fours | {totalSixes} Sixes</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* LOWER THIRD THEMES */}
        {currentDisplayedGraphic === "LOWER_THIRD" && isScoreboardVisible && (
          <>
            {/* THEME 1: SKY / SONY (6-Block) */}
            {activeTheme === "sky" && (
              <motion.div
                key="theme-sky"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-4"
              >
                <div className="flex h-[52px] w-full max-w-[1040px] items-stretch overflow-hidden rounded-xl border border-slate-800 bg-[#0c1424] shadow-[0_12px_35px_rgba(0,0,0,0.85)]">
                  <div className="flex min-w-[70px] items-center justify-center bg-[#070b14] px-3 font-broadcast text-2xl font-black text-white">
                    {battingCode}
                  </div>
                  <div className={`flex min-w-[130px] flex-col justify-center px-3.5 ${isSecondInnings ? "bg-[#8b8b1a] text-slate-950" : "bg-[#d91b83] text-white"}`}>
                    <div className="font-score text-3xl leading-none font-bold">{innings?.score}-{innings?.wickets}</div>
                    <div className="text-[10px] font-bold opacity-90">({innings?.overs} ov)</div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] flex-col justify-center border-r border-slate-800 bg-[#0f172a] px-3.5 py-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold uppercase text-white">{striker?.name}<span className="text-amber-400">*</span></span>
                      <span className="font-mono font-bold text-white">{striker?.runs} <span className="text-[10px] text-slate-400 font-normal">({striker?.balls})</span></span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-slate-400">
                      <span className="truncate font-medium uppercase">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-300">{nonStriker?.runs || 0} <span className="text-[10px] text-slate-500 font-normal">({nonStriker?.balls || 0})</span></span>
                    </div>
                  </div>
                  <div className="flex min-w-[180px] flex-col justify-center bg-[#e2e8f0] px-3.5 py-0.5 text-slate-900">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-600">
                      <span>{isSecondInnings ? "TARGET" : "RUN RATE"}</span>
                      <span>BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between font-bold">
                      <span className="font-score text-xl text-slate-950">{isSecondInnings ? targetScore : crr}</span>
                      <span className="text-[10px] font-black text-slate-800">{totalFours} 4s • {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] items-center justify-between border-l border-slate-800 bg-[#0f172a] px-4 text-xs">
                    <div>
                      <div className="font-bold uppercase text-white truncate max-w-[110px]">{activeBowler?.name}</div>
                      <div className="font-mono text-[10px] font-bold text-emerald-400">{activeBowler?.wickets}-{activeBowler?.runs} <span className="text-slate-400 font-normal">({activeBowler?.overs})</span></div>
                    </div>
                    <div className="flex items-center gap-1 pl-2">
                      {currentOverBalls.length > 0 ? currentOverBalls.map((b, i) => renderBallCircle(b, i, true)) : <span className="text-[10px] text-slate-500">Over Start</span>}
                    </div>
                  </div>
                  <div className="flex min-w-[70px] items-center justify-center bg-[#070b14] px-3 font-broadcast text-2xl font-black text-slate-300">
                    {bowlingCode}
                  </div>
                </div>
              </motion.div>
            )}

            {/* THEME 2: ULTRA DARK (Matrix) */}
            {activeTheme === "dark" && (
              <motion.div
                key="theme-dark"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-4"
              >
                <div className="flex h-[52px] w-full max-w-[1040px] items-stretch overflow-hidden rounded-xl border border-amber-400/60 bg-[#06080e] shadow-[0_12px_40px_rgba(0,0,0,0.9)]">
                  <div className="flex min-w-[70px] items-center justify-center bg-[#005f3b] px-3 font-broadcast text-2xl font-black text-white">{battingCode}</div>
                  <div className="flex min-w-[130px] items-center justify-between border-r border-amber-400/60 bg-slate-950 px-3.5">
                    <div className="font-score text-3xl text-white">{innings?.score}<span className="text-amber-400">/{innings?.wickets}</span></div>
                    <div className="text-right text-[10px] font-bold text-slate-400">
                      <div>({innings?.overs})</div>
                      <div className="text-amber-400">CRR {crr}</div>
                    </div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] flex-col justify-center border-r border-slate-800 bg-[#0c1018] px-3.5 py-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold text-white">{striker?.name}*</span>
                      <span className="font-score text-lg text-amber-400">{striker?.runs} <span className="font-sans text-[10px] text-slate-400">({striker?.balls})</span></span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-slate-400">
                      <span className="truncate font-medium">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-300">{nonStriker?.runs || 0}</span>
                    </div>
                  </div>
                  <div className="flex min-w-[180px] flex-col justify-center border-r border-slate-800 bg-slate-950 px-3.5 py-0.5 text-[10px]">
                    <div className="flex items-center justify-between font-bold text-slate-400">
                      <span>{isSecondInnings ? "TARGET" : "RATE"}</span>
                      <span>BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-score text-xl text-amber-400">{isSecondInnings ? targetScore : `CRR ${crr}`}</span>
                      <span className="font-bold text-slate-200">{totalFours} 4s • {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] items-center justify-between bg-[#0c1018] px-4 text-xs">
                    <div>
                      <div className="font-bold uppercase text-white truncate max-w-[110px]">{activeBowler?.name}</div>
                      <div className="font-mono text-[10px] font-bold text-amber-400">{activeBowler?.wickets}-{activeBowler?.runs} <span className="text-slate-400">({activeBowler?.overs})</span></div>
                    </div>
                    <div className="flex items-center gap-1 pl-2">
                      {currentOverBalls.length > 0 ? currentOverBalls.map((b, i) => renderBallCircle(b, i, true)) : <span className="text-[10px] text-slate-500">Over Start</span>}
                    </div>
                  </div>
                  <div className="flex min-w-[70px] items-center justify-center bg-[#0c1018] border-l border-slate-800 px-3 font-broadcast text-2xl font-black text-slate-300">{bowlingCode}</div>
                </div>
              </motion.div>
            )}

            {/* THEME 3: PSL CYBER (Neon) */}
            {activeTheme === "psl" && (
              <motion.div
                key="theme-psl"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-4"
              >
                <div className="flex h-[52px] w-full max-w-[1040px] items-stretch overflow-hidden rounded-xl border border-lime-400 bg-slate-950 shadow-[0_0_25px_rgba(132,204,22,0.25)]">
                  <div className="flex min-w-[70px] items-center justify-center bg-gradient-to-r from-[#84cc16] to-[#a3e635] px-3 font-broadcast text-2xl font-black text-slate-950">{battingCode}</div>
                  <div className="flex min-w-[130px] flex-col justify-center bg-[#0f172a] px-3.5 border-r border-slate-800 text-white">
                    <div className="font-score text-3xl leading-none text-lime-400 font-bold">{innings?.score}-{innings?.wickets}</div>
                    <div className="text-[10px] font-bold text-slate-400">({innings?.overs} ov)</div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] flex-col justify-center border-r border-slate-800 bg-slate-950 px-3.5 py-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold text-lime-400">{striker?.name}*</span>
                      <span className="font-mono font-bold text-white">{striker?.runs} ({striker?.balls})</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-slate-400">
                      <span className="truncate font-medium">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-300">{nonStriker?.runs || 0}</span>
                    </div>
                  </div>
                  <div className="flex min-w-[180px] flex-col justify-center bg-[#0f172a] px-3.5 py-0.5 border-r border-slate-800 text-[10px]">
                    <div className="flex items-center justify-between font-bold text-slate-400">
                      <span>{isSecondInnings ? "TARGET" : "CRR"}</span>
                      <span className="text-lime-400">BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between font-bold">
                      <span className="font-score text-xl text-lime-400">{isSecondInnings ? targetScore : crr}</span>
                      <span className="text-[10px] text-white">{totalFours} 4s • {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] items-center justify-between bg-slate-950 px-4 text-xs">
                    <div>
                      <div className="font-bold uppercase text-white truncate max-w-[110px]">{activeBowler?.name}</div>
                      <div className="font-mono text-[10px] font-bold text-lime-400">{activeBowler?.wickets}-{activeBowler?.runs} <span className="text-slate-400 font-normal">({activeBowler?.overs})</span></div>
                    </div>
                    <div className="flex items-center gap-1 pl-2">
                      {currentOverBalls.length > 0 ? currentOverBalls.map((b, i) => renderBallCircle(b, i, true)) : <span className="text-[10px] text-slate-500">Over Start</span>}
                    </div>
                  </div>
                  <div className="flex min-w-[70px] items-center justify-center bg-[#0f172a] px-3 font-broadcast text-2xl font-black text-lime-400/80">{bowlingCode}</div>
                </div>
              </motion.div>
            )}

            {/* THEME 4: FOX SPORTS */}
            {activeTheme === "fox" && (
              <motion.div
                key="theme-fox"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-4"
              >
                <div className="flex h-[52px] w-full max-w-[1040px] items-stretch overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xl text-slate-900">
                  <div className="flex min-w-[70px] items-center justify-center bg-[#0c2340] px-3 font-broadcast text-2xl font-black text-white">{battingCode}</div>
                  <div className="flex min-w-[130px] items-center justify-center bg-[#0c2340] px-4 text-white">
                    <div>
                      <div className="font-score text-3xl leading-none font-bold text-white">{innings?.score}/{innings?.wickets}</div>
                      <div className="text-[10px] font-bold text-sky-400">({innings?.overs} ov)</div>
                    </div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] flex-col justify-center border-r border-slate-300 bg-slate-50 px-3.5 py-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2 font-bold text-[#0c2340]">
                      <span className="truncate">{striker?.name}*</span>
                      <span className="font-mono">{striker?.runs} ({striker?.balls})</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-slate-600">
                      <span className="truncate font-medium">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-800">{nonStriker?.runs || 0}</span>
                    </div>
                  </div>
                  <div className="flex min-w-[180px] flex-col justify-center bg-slate-200 border-r border-slate-300 px-3.5 py-0.5 text-[10px] text-slate-900">
                    <div className="flex items-center justify-between font-extrabold text-slate-600">
                      <span>{isSecondInnings ? "TARGET" : "CRR"}</span>
                      <span>BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between font-bold">
                      <span className="font-score text-xl text-[#0c2340]">{isSecondInnings ? targetScore : crr}</span>
                      <span className="text-[10px] font-black text-slate-800">{totalFours} 4s • {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] items-center justify-between bg-white px-4 text-xs">
                    <div>
                      <div className="font-bold uppercase text-[#0c2340] truncate max-w-[110px]">{activeBowler?.name}</div>
                      <div className="font-mono text-[10px] font-bold text-emerald-700">{activeBowler?.wickets}/{activeBowler?.runs} <span className="text-slate-500 font-normal">({activeBowler?.overs})</span></div>
                    </div>
                    <div className="flex items-center gap-1 pl-2">
                      {currentOverBalls.length > 0 ? currentOverBalls.map((b, i) => renderBallCircle(b, i, false)) : <span className="text-[10px] text-slate-500">Over Start</span>}
                    </div>
                  </div>
                  <div className="flex min-w-[70px] items-center justify-center bg-[#0c2340] px-3 font-broadcast text-2xl font-black text-slate-300">{bowlingCode}</div>
                </div>
              </motion.div>
            )}

            {/* THEME 5: IPL NEON */}
            {activeTheme === "ipl" && (
              <motion.div
                key="theme-ipl"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-4"
              >
                <div className="flex h-[52px] w-full max-w-[1040px] items-stretch border border-amber-500/80 bg-slate-950/95 shadow-[0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-xl rounded-xl overflow-hidden">
                  <div className="flex min-w-[70px] items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 px-3 font-broadcast text-2xl font-black text-slate-950">{battingCode}</div>
                  <div className="flex min-w-[130px] items-center justify-center border-r border-slate-800 px-3.5">
                    <div>
                      <div className="font-score text-3xl text-white">{innings?.score}<span className="text-amber-500">/{innings?.wickets}</span></div>
                      <div className="text-[10px] font-bold text-amber-400">({innings?.overs} ov)</div>
                    </div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] flex-col justify-center border-r border-slate-800 bg-[#0f172a] px-3.5 py-0.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-bold text-white">{striker?.name}*</span>
                      <span className="font-mono font-bold text-amber-400">{striker?.runs} ({striker?.balls})</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-slate-400">
                      <span className="truncate font-medium">{nonStriker?.name || "—"}</span>
                      <span className="font-mono text-slate-300">{nonStriker?.runs || 0}</span>
                    </div>
                  </div>
                  <div className="flex min-w-[180px] flex-col justify-center bg-slate-900 border-r border-slate-800 px-3.5 py-0.5 text-[10px]">
                    <div className="flex items-center justify-between font-bold text-slate-400">
                      <span>{isSecondInnings ? "TARGET" : "CRR"}</span>
                      <span className="text-amber-400">BOUNDARIES</span>
                    </div>
                    <div className="flex items-baseline justify-between font-bold">
                      <span className="font-score text-xl text-amber-400">{isSecondInnings ? targetScore : crr}</span>
                      <span className="text-[10px] text-white">{totalFours} 4s • {totalSixes} 6s</span>
                    </div>
                  </div>
                  <div className="flex flex-1 min-w-[200px] items-center justify-between bg-slate-950 px-4 text-xs">
                    <div>
                      <div className="font-bold uppercase text-white truncate max-w-[110px]">{activeBowler?.name}</div>
                      <div className="font-mono text-[10px] font-bold text-emerald-400">{activeBowler?.wickets}-{activeBowler?.runs} <span className="text-slate-400 font-normal">({activeBowler?.overs})</span></div>
                    </div>
                    <div className="flex items-center gap-1 pl-2">
                      {currentOverBalls.length > 0 ? currentOverBalls.map((b, i) => renderBallCircle(b, i, true)) : <span className="text-[10px] text-slate-500">Over Start</span>}
                    </div>
                  </div>
                  <div className="flex min-w-[70px] items-center justify-center bg-slate-900 px-3 font-broadcast text-2xl font-black text-slate-300">{bowlingCode}</div>
                </div>
              </motion.div>
            )}

            {/* THEME 6: MINIMAL BAR */}
            {activeTheme === "minimal" && (
              <motion.div
                key="theme-minimal"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                className="fixed bottom-6 left-0 right-0 flex justify-center px-4"
              >
                <div className="relative flex h-[56px] w-full max-w-[960px] items-center justify-between overflow-hidden rounded-xl border border-slate-800 bg-[#080c16]/95 px-5 shadow-[0_15px_35px_rgba(0,0,0,0.9)] backdrop-blur-xl">
                  <div className="absolute left-0 top-0 h-0.5 w-full bg-gradient-to-r from-blue-500 via-amber-400 to-emerald-400" />

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-600/20 text-base shadow-inner">
                      🏏
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-broadcast text-xl font-black uppercase text-white">
                          {battingTeamName}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          vs {bowlingTeamName}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {meta?.tournament || "Local Tournament"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="font-score text-4xl font-black text-amber-400">
                      {innings?.score || 0}
                      <span className="mx-0.5 text-2xl text-slate-500">/</span>
                      {innings?.wickets || 0}
                    </div>

                    <div className="border-l border-slate-800 py-0.5 pl-3">
                      <div className="text-xs font-bold text-white">
                        {innings?.overs || "0.0"}{" "}
                        <span className="text-[10px] text-slate-400">/ {maxOvers} ov</span>
                      </div>
                      <div className="font-mono text-[10px] font-bold text-slate-400">
                        CRR: <span className="text-emerald-400">{crr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-300">
                      {isSecondInnings ? (
                        <span>
                          Target: <strong className="text-white">{targetScore}</strong> (Need{" "}
                          <strong className="text-amber-400">{Math.max(0, targetScore - (innings?.score || 0))}</strong>)
                        </span>
                      ) : (
                        <span>1st Innings • Target: TBD</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase text-slate-400">OVER:</span>
                      <div className="flex items-center gap-1">
                        {currentOverBalls.length > 0 ? (
                          currentOverBalls.map((b, i) => renderBallCircle(b, i, true))
                        ) : (
                          <span className="text-[10px] text-slate-400">Over Start</span>
                        )}
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