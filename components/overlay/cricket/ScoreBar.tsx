"use client";

import { motion } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { getCricketTheme } from "@/lib/themes/cricketThemes";

interface Props {
  theme?: string;
}

export default function ScoreBar({ theme }: Props) {
  const { matchData, loading } = useMatchData();

  if (loading || !matchData?.meta) return null;

  const { meta, cricket } = matchData;

  if (meta.showScoreboard === false) return null;

  const isSecondInnings = cricket?.currentInnings === 2;
  const innings = isSecondInnings ? cricket?.innings2 : cricket?.innings1;
  const target = innings?.target;
  const t = getCricketTheme(theme);

  return (
    <motion.div
      initial={{ y: 150, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="fixed bottom-12 left-0 right-0 flex justify-center drop-shadow-2xl"
    >
      {/* chyron: angular broadcast-lower-third cut — the one signature shape,
          tournament theme still fully controls the color underneath it */}
      <div className={`chyron flex items-center border-2 ${t.border} shadow-[0_10px_40px_rgba(0,0,0,0.5)]`}>
        <div className={`${t.teamBar} flex items-center gap-3 px-8 py-3 font-broadcast text-xl font-bold uppercase tracking-wider`}>
          <span>{meta.teamA}</span>
          <span className={`${t.vsAccent} text-sm`}>VS</span>
          <span>{meta.teamB}</span>
        </div>

        <div className={`${t.scoreBox} flex items-baseline px-8 py-3 font-score text-4xl`}>
          {innings?.score}
          <span className={`${t.scoreSlash} mx-1 text-2xl`}>/</span>
          {innings?.wickets}
        </div>

        <div className={`${t.oversBox} px-6 py-3 font-broadcast text-xl font-bold uppercase tracking-widest`}>
          Overs <span className={`${t.oversAccent} ml-2`}>{innings?.overs}</span>
        </div>

        {isSecondInnings && target && (
          <div className={`${t.targetChip} px-6 py-3 font-broadcast text-lg font-black uppercase tracking-widest`}>
            Need {Math.max(target - (innings?.score || 0), 0)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
