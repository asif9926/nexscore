// components/overlay/BroadcastLogoBadge.tsx
"use client";

import { motion } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";

export default function BroadcastLogoBadge({ matchId }: { matchId?: string }) {
  const { matchData, loading } = useMatchData(matchId);

  if (loading || !matchData?.meta || matchData.meta.showLogo === false) return null;

  const { customLogoUrl, customLogoLeftUrl, sport, tournament } = matchData.meta as any;
  const isCricket = sport === "cricket";

  return (
    <>
      {/* 🔹 LEFT BUG: Tournament Logo */}
      {isCricket && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none fixed left-8 top-7 z-40 select-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)]"
        >
          {customLogoLeftUrl ? (
            <div className="flex h-11 min-w-[90px] max-w-[160px] items-center justify-center rounded-xl border border-white/20 bg-slate-950/85 px-3 py-1.5 backdrop-blur-md">
              <img
                src={customLogoLeftUrl}
                alt="Tournament Logo"
                className="h-full w-full object-contain drop-shadow"
              />
            </div>
          ) : (
            <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/85 px-3 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-broadcast text-[11px] font-black uppercase tracking-widest text-slate-200">
                {tournament || "LIVE CRICKET"}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {/* 🔹 RIGHT BUG: TV Channel Watermark */}
      <motion.div
        initial={{ opacity: 0, x: 15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className="pointer-events-none fixed right-8 top-7 z-40 select-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.85)]"
      >
        {customLogoUrl ? (
          <div className="flex h-11 min-w-[90px] max-w-[160px] items-center justify-center rounded-xl border border-white/20 bg-slate-950/85 px-3 py-1.5 backdrop-blur-md">
            <img
              src={customLogoUrl}
              alt="Channel Logo"
              className="h-full w-full object-contain drop-shadow"
            />
          </div>
        ) : (
          <div className="chyron flex h-10 items-center gap-2 border-2 border-amber-400 bg-gradient-to-r from-slate-950 via-[#0d1527] to-slate-950 px-3.5 shadow-[0_8px_25px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-orange-500 font-broadcast text-xs font-black text-slate-950 shadow">
              NS
            </div>
            <div className="flex flex-col justify-center leading-none">
              <div className="flex items-center gap-1">
                <span className="font-broadcast text-sm font-black tracking-wider text-white">
                  NEX<span className="text-amber-400">SCORE</span>
                </span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              </div>
              <span className="font-sans text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">
                HD LIVE
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}