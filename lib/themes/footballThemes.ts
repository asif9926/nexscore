// lib/themes/footballThemes.ts
export interface FootballOverlayTheme {
  key: string;
  label: string;
  teamBar: string;
  scoreBox: string;
  timerBox: string;
  border: string;
}

export const FOOTBALL_THEMES: Record<string, FootballOverlayTheme> = {
  bpl: {
    key: "bpl",
    label: "Domestic League",
    teamBar: "text-white",
    scoreBox: "bg-emerald-600 text-white",
    timerBox: "bg-slate-100 text-slate-900",
    border: "border-slate-700/50",
  },
  ipl: {
    key: "premier",
    label: "Premier",
    teamBar: "text-white",
    scoreBox: "bg-purple-700 text-white",
    timerBox: "bg-slate-100 text-purple-900",
    border: "border-purple-500/40",
  },
  worldcup: {
    key: "worldcup",
    label: "International",
    teamBar: "text-white",
    scoreBox: "bg-blue-800 text-white",
    timerBox: "bg-amber-50 text-slate-900",
    border: "border-amber-400/40",
  },
};

export const DEFAULT_FOOTBALL_THEME = FOOTBALL_THEMES.bpl;

export function getFootballTheme(themeKey?: string): FootballOverlayTheme {
  if (!themeKey) return DEFAULT_FOOTBALL_THEME;
  return FOOTBALL_THEMES[themeKey.toLowerCase()] || DEFAULT_FOOTBALL_THEME;
}
