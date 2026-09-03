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
  createdBy?: string;
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
  legalBallsDelivered?: number; // ক্যালকুলেশনের নির্ভুলতার জন্য
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
  label: string;
  batsmanName: string;
  bowlerName: string;
  bowlerId?: string; // 🛡️ পরপর দুই ওভার বোলিং ট্র্যাকিং ফিল্ড
  isWicket: boolean;
  wicketType?: string;
  isExtra: boolean;
  extraType?: string;
  text?: string;
  timestamp: number;
}

export interface CricketInnings {
  battingTeam: string;
  score: number;
  wickets: number;
  overs: string;
  totalBallsDelivered?: number; // ফ্র্যাকশনাল হিসাবের সুবিধার্থে
  runRate: number;
  extras: CricketExtras;
  batsmen: Batsman[];
  bowlers: Bowler[];
  recentBalls: BallCommentary[]; // ফিক্সড: স্ট্রিং ইউনিয়ন দূর করা হয়েছে
  fallOfWickets: FallOfWicket[];
  isCompleted: boolean;
  target?: number;
}

export interface CricketState {
  maxOvers: number;
  toss: { winner: 'teamA' | 'teamB' | null; decision: 'bat' | 'bowl' | null };
  squads: { teamA: Player[]; teamB: Player[] };
  currentInnings: 1 | 2;
  innings1: CricketInnings;
  innings2: CricketInnings;
}

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
  half: string;
  currentHalf: 1 | 2;
  squads: { teamA: Player[]; teamB: Player[] };
  half1: FootballHalfStats;
  half2: FootballHalfStats;
  cards: { teamA: FootballCard[]; teamB: FootballCard[] };
  substitutions: { teamA: FootballSubstitution[]; teamB: FootballSubstitution[] };
  events: FootballEvent[];
}

export interface MatchPresence {
  admins?: Record<string, boolean>;
  lastPing: number;
}

export interface MatchData {
  meta: MatchMeta;
  presence: MatchPresence;
  cricket?: CricketState;
  football?: FootballState;
}