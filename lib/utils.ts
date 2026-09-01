// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS class merging utility
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ensures data is an array (Firebase RTDB অবজেক্ট বা নাল ভ্যালু রিটার্ন করলেও ক্র্যাশ ঠেকাবে)
 */
export function safeArray<T>(arr?: any): T[] {
  if (!arr) return [];
  if (Array.isArray(arr)) return arr;
  if (typeof arr === "object") return Object.values(arr);
  return [];
}

/**
 * ক্রিকেট ওভার ("10.4") কে দশমিক মানে কনভার্ট করে (10 + 4/6 = 10.6667)
 */
export function oversToDecimal(oversStr?: string | number): number {
  if (!oversStr) return 0;
  const [overs, balls] = String(oversStr).split(".").map(Number);
  return (overs || 0) + (balls || 0) / 6;
}

/**
 * Current Run Rate (CRR) গণনা
 */
export function calculateCRR(score: number = 0, oversStr?: string | number): string {
  const [overs, balls] = String(oversStr || "0.0").split(".").map(Number);
  const totalBalls = (overs || 0) * 6 + (balls || 0);
  if (totalBalls === 0) return "0.00";
  return ((score / totalBalls) * 6).toFixed(2);
}

/**
 * Required Run Rate (RRR) গণনা
 */
export function calculateRRR(
  target: number = 0,
  currentScore: number = 0,
  maxOvers: number = 20,
  currentOversStr?: string | number
): string {
  const [overs, balls] = String(currentOversStr || "0.0").split(".").map(Number);
  const ballsBowled = (overs || 0) * 6 + (balls || 0);
  const remainingBalls = Math.max(0, maxOvers * 6 - ballsBowled);
  const runsNeeded = Math.max(0, target - currentScore);

  if (runsNeeded === 0) return "0.00";
  if (remainingBalls === 0) return runsNeeded > 0 ? "0.00" : "0.00";
  return ((runsNeeded / remainingBalls) * 6).toFixed(2);
}

/**
 * ব্যাটার স্ট্রাইক রেট (SR) গণনা
 */
export function calculateSR(runs: number = 0, balls: number = 0): string {
  if (!balls || balls <= 0) return "0.0";
  return ((runs / balls) * 100).toFixed(1);
}

/**
 * বোলার ইকোনমি রেট (Economy) গণনা
 */
export function calculateEconomy(runs: number = 0, oversStr?: string | number): string {
  const oversDec = oversToDecimal(oversStr);
  if (oversDec === 0) return "0.00";
  return (runs / oversDec).toFixed(2);
}

/**
 * টিম নাম থেকে ২-৩ অক্ষরের ব্রডকাস্ট শর্ট কোড তৈরি
 */
export function getShortName(name?: string, fallback: string = "TM"): string {
  if (!name || name.trim() === "") return fallback;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}