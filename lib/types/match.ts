// lib/types/match.ts

export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Forward' | 'Midfielder' | 'Defender' | 'Goalkeeper';
  isCaptain: boolean;
  isWicketKeeper: boolean;
}

export type BroadcastGraphicType = 
  | 'LOWER_THIRD'
  | 'BATSMAN_CARD'
  | 'BOWLER_CARD'
  | 'PARTNERSHIP_CARD'
  | 'MATCH_SUMMARY'
  | 'INNINGS_BREAK'
  | 'RESULT_POSTER'
  | 'MINIMAL';

export interface MatchMeta {
  sport: "cricket" | "football";
  status: "live" | "completed" | "upcoming";
  createdBy?: string; // 🛡️ Multi-Tenant Admin UID
  teamA: string;
  teamB: string;
  tournament?: string;
  venue?: string;
  activeTheme?: string;
  activeGraphic?: BroadcastGraphicType;
  showScoreboard?: boolean;
  showLogo?: boolean;
  customLogoUrl?: string | null;
  customLogoLeftUrl?: string | null;
  currentEvent?: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface ActionLog {
  timestamp: number;
  type: string;
  previousState: any;
}

// --- CRICKET ---
export interface Batsman {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  onStrike: boolean;
  isOut: boolean;
  dismissal?: string;
}

export interface Bowler {
  id: string;
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  isActive: boolean;
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  overs: string;
  batsmanName: string;
}

export interface CricketExtras {
  wide: number;
  noBall: number;
  bye: number;
  legBye: number;
}

export interface BallCommentary {
  ballNumber: string;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  isExtra: boolean;
  extraType?: string;
  batsmanName: string;
  bowlerName: string;
  text: string;
  timestamp: number;
  label: string; // "1", "W", "Wd" ইত্যাদি ওভার টাইমলাইনে দেখানোর জন্য
}


export interface CricketInnings {
  battingTeam: string;
  score: number;
  wickets: number;
  overs: string;
  runRate: number;
  extras: CricketExtras;
  batsmen: Batsman[];
  bowlers: Bowler[];
  recentBalls: (string | BallCommentary)[];
  fallOfWickets: FallOfWicket[];
  isCompleted: boolean;
  target?: number; // 2nd Innings Target
}

export interface CricketState {
  maxOvers: number; // T20, ODI, T10 etc
  toss: { winner: 'teamA' | 'teamB' | null; decision: 'bat' | 'bowl' | null };
  squads: { teamA: Player[]; teamB: Player[] };
  currentInnings: 1 | 2;
  innings1: CricketInnings;
  innings2: CricketInnings;
}

// --- FOOTBALL ---
export interface FootballCard {
  type: 'yellow' | 'red';
  minute: number;
  timestamp: number;
}

export interface FootballEvent {
  id: string;
  type: 'goal' | 'yellow_card' | 'red_card';
  team: 'teamA' | 'teamB';
  minute: number;
  timestamp: number;
}

export interface FootballPossession {
  teamA: number;
  teamB: number;
}

export interface FootballHalfStats {
  goalsA: number;
  goalsB: number;
  possession: FootballPossession;
}

// ✅ NEW: Football Substitution Interface added to replace `unknown`
export interface FootballSubstitution {
  playerInId: string;
  playerOutId: string;
  minute: number;
  timestamp: number;
}

export interface FootballState {
  scoreA: number;
  scoreB: number;
  redCardsA: number;
  redCardsB: number;
  yellowCardsA: number;
  yellowCardsB: number;
  isRunning: boolean;
  startedAt: number | null;
  elapsedSeconds: number;
  half: string; // "1ST HALF" | "HALF TIME" | "2ND HALF" | "FULL TIME"
  currentHalf: 1 | 2;
  squads: { teamA: Player[]; teamB: Player[] };
  half1: FootballHalfStats;
  half2: FootballHalfStats;
  cards: { teamA: FootballCard[]; teamB: FootballCard[] };
  // ✅ FIXED: Using the new interface instead of unknown[]
  substitutions: { teamA: FootballSubstitution[]; teamB: FootballSubstitution[] };
  events: FootballEvent[];
}

// ✅ FIXED: আগে { adminOnline: boolean; lastPing: number } ছিল, কিন্তু
// useConnectionStatus.ts আসলে কখনোই "adminOnline" নামে কিছু লেখে না — লেখে
// `presence/admins/{sessionId}: true` (প্রতি ট্যাব/সেশনের জন্য আলাদা key,
// onDisconnect() দিয়ে অটো-ক্লিনআপ)। টাইপটা রানটাইম শেপের সাথে মিলছিল না বলেই
// ReconnectingBanner-এর বাগটা TypeScript ধরতে পারেনি। এখন আসল শেপ অনুযায়ী।
export interface MatchPresence {
  admins?: Record<string, boolean>;
  lastPing: number;
}

export interface MatchData {
  meta: MatchMeta;
  presence: MatchPresence;
  // ✅ FIXED: actionLog আর এখানে থাকে না — এখন আলাদা RTDB root নোড
  // ("match_actionLog", দেখো lib/firebase/actions.ts) হওয়ায় এই MatchData shape-এর
  // অংশ না, তাই এখান থেকে বাদ। এতে root "match" listener (MatchDataContext)
  // আর কখনোই actionLog history ডাউনলোড করবে না — যেটাই ছিল আসল bloat-এর কারণ।
  cricket?: CricketState;
  football?: FootballState;
}
