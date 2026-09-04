// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MatchData } from "./types/match";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeArray<T>(val: any): T[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "object") return Object.values(val);
  return [];
}

export const oversToTotalBalls = (oversStr: string = "0.0"): number => {
  const [overs, balls] = (oversStr || "0.0").split(".").map(Number);
  return (overs || 0) * 6 + (balls || 0);
};

export const oversToDecimal = (oversStr?: string): number => {
  if (!oversStr) return 0;
  const [o, b] = oversStr.split(".").map(Number);
  return (o || 0) + (b || 0) / 6;
};

export const getMaxWickets = (squadLength: number = 11): number => {
  return Math.max(1, squadLength - 1);
};

export const calculateSR = (runs: number = 0, balls: number = 0): string => {
  if (!balls || balls === 0) return "0.00";
  return ((runs / balls) * 100).toFixed(2);
};

export const calculateEconomy = (runs: number = 0, oversStr: string = "0.0"): string => {
  const oversDec = oversToDecimal(oversStr);
  if (oversDec === 0) return "0.00";
  return (runs / oversDec).toFixed(2);
};

export const calculateCRR = (score: number = 0, oversStr: string = "0.0"): string => {
  const totalBalls = oversToTotalBalls(oversStr);
  if (totalBalls === 0) return "0.00";
  return ((score / totalBalls) * 6).toFixed(2);
};

export const calculateRRR = (
  target: number = 0,
  currentScore: number = 0,
  maxOvers: number = 20,
  oversStr: string = "0.0"
): string => {
  const ballsBowled = oversToTotalBalls(oversStr);
  const ballsRemaining = Math.max(0, maxOvers * 6 - ballsBowled);
  const runsNeeded = Math.max(0, target - currentScore);

  if (runsNeeded === 0) return "0.00";
  if (ballsRemaining === 0) return runsNeeded > 0 ? "Req. inf" : "0.00";

  return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
};

export function getShortName(fullName?: string, fallback = "TMA"): string {
  if (!fullName) return fallback;
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 3) {
    return (parts[0][0] + parts[1][0] + parts[2][0]).toUpperCase();
  }
  if (parts.length === 2 && parts[0]?.length && parts[1]?.length) {
    return (parts[0].slice(0, 2) + parts[1][0]).toUpperCase();
  }
  return fullName.slice(0, 3).toUpperCase();
}

// 🛡️ নিখুঁত ওভার ডেলিভারি গণনাকারী (ওয়াইড/নো-বল যাই হোক, চলতি ওভারের সব ডেলিভারি ধরবে)
export function getCurrentOverDeliveries(recentBalls: any[] = [], oversStr: string = "0.0"): any[] {
  if (!recentBalls || recentBalls.length === 0) return [];

  const [, ballsPart] = (oversStr || "0.0").split(".").map(Number);
  const currentLegalBalls = (ballsPart === 0 && oversStr !== "0.0") ? 6 : (ballsPart || 0);

  const deliveries: any[] = [];
  let legalCount = 0;

  const lastBall = recentBalls[recentBalls.length - 1];
  const currentBowlerKey = lastBall?.bowlerId || lastBall?.bowlerName;

  for (let i = recentBalls.length - 1; i >= 0; i--) {
    const ball = recentBalls[i];
    const isLegal = typeof ball === "object" && ball !== null
      ? !ball.isExtra || ball.extraType === "Bye" || ball.extraType === "Leg Bye"
      : !String(ball).includes("Wd") && !String(ball).includes("Nb");

    const ballBowlerKey = ball?.bowlerId || ball?.bowlerName;
    const isDifferentBowler = currentBowlerKey && ballBowlerKey && currentBowlerKey !== ballBowlerKey;

    // যদি বর্তমান ওভারের সব বৈধ বল গোনা শেষ হয়ে যায় এবং পরবর্তী বলটি আগের ওভারের বৈধ বল হয়
    if (isLegal && legalCount >= currentLegalBalls) {
      break;
    }

    // বোলার পরিবর্তন হলে আগের ওভারে চলে গেছে বোঝা যাবে
    if (isDifferentBowler && legalCount > 0) {
      break;
    }

    deliveries.unshift(ball);

    if (isLegal) {
      legalCount++;
    }
  }

  return deliveries;
}

export function calculateMatchResult(matchData: MatchData | null | undefined): string {
  if (!matchData?.meta) return "Match Completed";
  
  const { meta, cricket, football } = matchData;
  if (meta.finalResult && meta.finalResult !== "Match Completed") {
    return meta.finalResult;
  }

  if (meta.sport === "cricket" && cricket) {
    const inn1 = cricket.innings1;
    const inn2 = cricket.innings2;
    const inn1Team = inn1?.battingTeam === "teamA" ? meta.teamA : meta.teamB;
    const inn2Team = inn1?.battingTeam === "teamA" ? meta.teamB : meta.teamA;
    const targetScore = inn2?.target || (inn1?.score || 0) + 1;
    const maxOvers = cricket.maxOvers || 20;

    const chasingSquadKey = (inn2?.battingTeam as "teamA" | "teamB") || (inn1?.battingTeam === "teamA" ? "teamB" : "teamA");
    const squadCount = cricket.squads?.[chasingSquadKey]?.length || 11;
    const maxWickets = getMaxWickets(squadCount);

    if (cricket.currentInnings === 1 || !inn2 || (inn2.score === 0 && (!inn2.overs || inn2.overs === "0.0"))) {
      return `${inn1Team} scored ${inn1?.score || 0}/${inn1?.wickets || 0} (${inn1?.overs || "0.0"} ov) • 1st Innings`;
    }

    if (inn2.score >= targetScore) {
      const wicketsLeft = Math.max(0, maxWickets - (inn2.wickets || 0));
      return `${inn2Team} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? "s" : ""}`;
    }

    const oversDec = oversToDecimal(inn2.overs);
    const isInn2Finished = inn2.isCompleted || oversDec >= maxOvers || (inn2.wickets || 0) >= maxWickets;

    if (isInn2Finished) {
      const runMargin = Math.max(0, targetScore - 1 - (inn2?.score || 0));
      if (runMargin > 0) {
        return `${inn1Team} won by ${runMargin} run${runMargin > 1 ? "s" : ""}`;
      }
      if (runMargin === 0) {
        return "Match Tied (Super Over Required)";
      }
    }

    return `${inn2Team} need ${Math.max(0, targetScore - (inn2.score || 0))} runs to win`;
  }

  if (football) {
    const scA = football.scoreA || 0;
    const scB = football.scoreB || 0;
    if (scA > scB) return `${meta.teamA} won the match`;
    if (scB > scA) return `${meta.teamB} won the match`;
    return "Match Draw";
  }

  return "Match Completed";
}