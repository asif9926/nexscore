// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 🛡️ ফিক্সড: <T = any> ডিফল্ট থাকায় unknown[] ইনফারেন্স এরর হবে না
export function safeArray<T = any>(arr: any): T[] {
  if (Array.isArray(arr)) return arr;
  if (arr && typeof arr === "object") return Object.values(arr);
  return [];
}

export function getShortName(name?: string, fallback = "TM"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

export function oversToDecimal(oversStr?: string | number): number {
  if (!oversStr) return 0;
  const [overs, balls] = String(oversStr).split(".").map(Number);
  return (overs || 0) + (balls || 0) / 6;
}

export function getMaxWickets(squadCount?: number): number {
  if (typeof squadCount === "number" && squadCount > 1) {
    return Math.min(10, squadCount - 1);
  }
  return 10;
}

export function calculateCRR(score: number, oversStr: string | number): string {
  const oversDec = oversToDecimal(oversStr);
  if (oversDec <= 0) return "0.00";
  return (score / oversDec).toFixed(2);
}

export function calculateRRR(
  targetScore: number,
  currentScore: number,
  maxOvers: number,
  currentOversStr: string | number
): string {
  const runsNeeded = targetScore - currentScore;
  if (runsNeeded <= 0) return "0.00";

  const [overs, balls] = String(currentOversStr || "0.0").split(".").map(Number);
  const totalBallsBowled = (overs || 0) * 6 + (balls || 0);
  const totalBallsInMatch = maxOvers * 6;
  const ballsRemaining = totalBallsInMatch - totalBallsBowled;

  if (ballsRemaining <= 0) return "0.00";
  return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
}

export function calculateEconomy(runs: number, oversStr: string | number): string {
  const oversDec = oversToDecimal(oversStr);
  if (oversDec <= 0) return "0.00";
  return (runs / oversDec).toFixed(2);
}

export function calculateSR(runs: number, balls: number): string {
  if (!balls || balls <= 0) return "0.0";
  return ((runs / balls) * 100).toFixed(1);
}