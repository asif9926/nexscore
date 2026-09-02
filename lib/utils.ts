import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind ক্লাস মার্জ করার জন্য স্ট্যান্ডার্ড হেল্পার
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * যেকোনো ভ্যালুকে নিরাপদ অ্যারেতে রূপান্তর করে (Uncaught TypeError রোধে)
 */
export function safeArray<T>(arr: any): T[] {
  if (Array.isArray(arr)) return arr;
  if (arr && typeof arr === "object") return Object.values(arr);
  return [];
}

/**
 * দলের নাম থেকে ২/৩ অক্ষরের শর্টকোড তৈরি করে
 */
export function getShortName(name?: string, fallback = "TM"): string {
  if (!name) return fallback;
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

/**
 * "overs.balls" স্ট্রিংকে ডেসিমাল ওভারে রূপান্তর করে (যেমন: "2.3" -> 2.5)
 */
export function oversToDecimal(oversStr?: string | number): number {
  if (!oversStr) return 0;
  const [overs, balls] = String(oversStr).split(".").map(Number);
  return (overs || 0) + (balls || 0) / 6;
}

/**
 * স্কোয়াডের প্লেয়ার সংখ্যার ওপর ভিত্তি করে সঠিক অল-আউট উইকেট সংখ্যা বের করে
 * (১১ জনের দলে ১০ উইকেট, ৬ জনের টুর্নামেন্টে ৫ উইকেট)
 */
export function getMaxWickets(squadCount?: number): number {
  if (typeof squadCount === "number" && squadCount > 1) {
    return squadCount - 1;
  }
  return 10;
}

/**
 * Current Run Rate (CRR) হিসাব করে
 */
export function calculateCRR(score: number, oversStr: string | number): string {
  const oversDec = oversToDecimal(oversStr);
  if (oversDec <= 0) return "0.00";
  return (score / oversDec).toFixed(2);
}

/**
 * Required Run Rate (RRR) হিসাব করে
 */
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

/**
 * বোলারের ইকোনমি রেট হিসাব করে
 */
export function calculateEconomy(runs: number, oversStr: string | number): string {
  const oversDec = oversToDecimal(oversStr);
  if (oversDec <= 0) return "0.00";
  return (runs / oversDec).toFixed(2);
}

/**
 * ব্যাটারের স্ট্রাইক রেট হিসাব করে
 */
export function calculateSR(runs: number, balls: number): string {
  if (!balls || balls <= 0) return "0.0";
  return ((runs / balls) * 100).toFixed(1);
}