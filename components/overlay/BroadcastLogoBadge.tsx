"use client";

import { motion } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";

export default function BroadcastLogoBadge() {
  const { matchData, loading } = useMatchData();

  if (loading || !matchData?.meta || matchData.meta.showLogo === false) return null;

  const { customLogoUrl } = matchData.meta;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed right-8 top-8 z-40 select-none pointer-events-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
    >
      {customLogoUrl ? (
        /* ১. ইউজার কাস্টম লোগো আপলোড করলে (Full 1080p Scale) */
        <div className="flex h-16 min-w-[120px] max-w-[220px] items-center justify-center rounded-2xl border-2 border-white/20 bg-slate-950/80 px-4 py-2 shadow-2xl backdrop-blur-md">
          <img
            src={customLogoUrl}
            alt="Tournament / Sponsor Logo"
            className="h-full w-full object-contain drop-shadow-md"
          />
        </div>
      ) : (
        /* ২. বিল্ট-ইন প্রিমিয়াম ব্রডকাস্ট নেটওয়ার্ক লোগো (Star Sports / Sky TV Standard) */
        <div className="chyron flex h-14 items-center gap-3.5 border-2 border-amber-400 bg-gradient-to-r from-slate-950 via-[#0d1527] to-slate-950 px-5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          {/* Glowing Emblem Badge */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 font-broadcast text-xl font-black text-slate-950 shadow-md">
            NS
          </div>

          {/* Typography Block */}
          <div className="flex flex-col justify-center leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-broadcast text-xl font-black tracking-wider text-white">
                NEX<span className="text-amber-400">SCORE</span>
              </span>
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
            </div>
            <span className="font-sans text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
              LIVE SPORTS ENGINE
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}