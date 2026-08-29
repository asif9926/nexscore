"use client";

import { motion } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { useFootballClock } from "@/lib/hooks/useFootballClock";
import { getFootballTheme } from "@/lib/themes/footballThemes";

interface Props {
  theme?: string;
}

export default function FootballScoreBar({ theme }: Props) {
  const { matchData, loading } = useMatchData();
  const footballClock = useFootballClock(matchData?.football);

  if (loading || !matchData?.meta || !matchData.football) return null;

  const { meta, football } = matchData;

  if (meta.showScoreboard === false) return null;

  const t = getFootballTheme(theme);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="fixed left-0 right-0 top-10 flex justify-center drop-shadow-2xl"
    >
      <div className={`chyron flex h-16 items-stretch border-2 ${t.border} bg-ink shadow-[0_10px_40px_rgba(0,0,0,0.5)]`}>
        <div className={`${t.teamBar} flex min-w-[150px] items-center justify-center gap-2 px-6 font-broadcast text-xl font-bold uppercase tracking-wider`}>
          <span>{meta.teamA}</span>
          {football.redCardsA > 0 && (
            <div className="h-4 w-3 rounded-sm bg-crimson" title={`${football.redCardsA} Red Card`} />
          )}
        </div>

        <div className={`${t.scoreBox} flex min-w-[120px] items-center justify-center gap-4 px-8 font-score text-4xl`}>
          <span>{football.scoreA}</span>
          <span className="text-2xl opacity-60">-</span>
          <span>{football.scoreB}</span>
        </div>

        <div className={`${t.teamBar} flex min-w-[150px] items-center justify-center gap-2 px-6 font-broadcast text-xl font-bold uppercase tracking-wider`}>
          {football.redCardsB > 0 && (
            <div className="h-4 w-3 rounded-sm bg-crimson" title={`${football.redCardsB} Red Card`} />
          )}
          <span>{meta.teamB}</span>
        </div>

        <div className={`${t.timerBox} flex min-w-[120px] flex-col items-center justify-center px-6 font-broadcast font-bold uppercase tracking-widest`}>
          <span className="mb-0.5 flex items-center gap-1 text-[10px] font-extrabold opacity-60">
            {football.isRunning && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-crimson" />}
            {football.half}
          </span>
          <span className="font-score text-lg leading-none">{footballClock.display}'</span>
        </div>
      </div>
    </motion.div>
  );
}
