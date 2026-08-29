// lib/themes/cricketThemes.ts
// প্রতিটা থিমের জন্য আলাদা Tailwind class — স্ট্রিং ইন্টারপোলেশন দিয়ে ডাইনামিক ক্লাস
// বানানো হয়নি, কারণ Tailwind JIT শুধু সোর্সে literal ক্লাস-নেম স্ক্যান করে বুঝতে পারে।

export interface CricketOverlayTheme {
  key: string;
  label: string;
  teamBar: string; // team names ব্যাকগ্রাউন্ড
  vsAccent: string; // "VS" টেক্সট কালার
  scoreBox: string; // score/wickets ব্যাকগ্রাউন্ড
  scoreSlash: string; // score-এর ভেতরে "/" এর কালার
  oversBox: string; // overs ব্যাকগ্রাউন্ড
  oversAccent: string; // overs নাম্বারের কালার
  targetChip: string; // ২য় ইনিংসে "Need X" চিপ
  border: string;
}

export const CRICKET_THEMES: Record<string, CricketOverlayTheme> = {
  bpl: {
    key: "bpl",
    label: "BPL",
    teamBar: "bg-emerald-950 text-white",
    vsAccent: "text-red-500",
    scoreBox: "bg-red-600 text-white",
    scoreSlash: "text-red-200",
    oversBox: "bg-white text-emerald-950",
    oversAccent: "text-red-600",
    targetChip: "bg-yellow-400 text-slate-950",
    border: "border-emerald-600/40",
  },
  ipl: {
    key: "ipl",
    label: "IPL",
    teamBar: "bg-indigo-950 text-white",
    vsAccent: "text-orange-400",
    scoreBox: "bg-orange-600 text-white",
    scoreSlash: "text-orange-200",
    oversBox: "bg-slate-100 text-indigo-950",
    oversAccent: "text-orange-600",
    targetChip: "bg-yellow-500 text-slate-950",
    border: "border-orange-500/40",
  },
  worldcup: {
    key: "worldcup",
    label: "World Cup",
    teamBar: "bg-slate-950 text-white",
    vsAccent: "text-amber-400",
    scoreBox: "bg-blue-800 text-white",
    scoreSlash: "text-blue-200",
    oversBox: "bg-amber-50 text-slate-900",
    oversAccent: "text-blue-800",
    targetChip: "bg-amber-400 text-slate-950",
    border: "border-amber-400/40",
  },
};

export const DEFAULT_CRICKET_THEME = CRICKET_THEMES.bpl;

export function getCricketTheme(themeKey?: string): CricketOverlayTheme {
  if (!themeKey) return DEFAULT_CRICKET_THEME;
  return CRICKET_THEMES[themeKey.toLowerCase()] || DEFAULT_CRICKET_THEME;
}
