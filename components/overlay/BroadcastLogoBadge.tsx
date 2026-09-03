// components/overlay/BroadcastLogoBadge.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";

interface Props {
  matchId?: string;
  matchData?: any;
}

export default function BroadcastLogoBadge({ matchId, matchData: propMatchData }: Props) {
  const { matchData: fetchedMatchData, loading } = useMatchData(propMatchData ? undefined : matchId);
  const matchData = propMatchData || fetchedMatchData;

  const [leftImageError, setLeftImageError] = useState(false);
  const [rightImageError, setRightImageError] = useState(false);

  if ((!propMatchData && loading) || !matchData?.meta || matchData.meta.showLogo === false) {
    return null;
  }

  const { customLogoUrl, customLogoLeftUrl, sport, tournament, logoBgStyle = "transparent" } = matchData.meta as any;
  const isCricket = sport === "cricket";

  // 🛡️ সিলেক্টেড মোড অনুযায়ী কনটেইনার ব্যাকগ্রাউন্ড
  const getContainerClasses = () => {
    switch (logoBgStyle) {
      case "white":
        return "bg-white/95 border border-slate-200/80 shadow-[0_8px_25px_rgba(0,0,0,0.4)] px-3.5 py-2";
      case "dark":
        return "bg-slate-950/80 border border-white/20 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.7)] px-3.5 py-2";
      case "transparent":
      default:
        return "bg-transparent border-0 p-0";
    }
  };

  const getImageClasses = () => {
    if (logoBgStyle === "transparent") {
      return "drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]";
    }
    return "";
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none [transform:translateZ(0)]">
      {/* 🔹 LEFT BUG: Tournament Logo (Cricket Only) */}
      {isCricket && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed left-8 top-7"
        >
          {customLogoLeftUrl && !leftImageError ? (
            <div className={`flex h-14 w-auto max-w-[220px] items-center justify-center rounded-2xl transition-all ${getContainerClasses()}`}>
              <img
                src={customLogoLeftUrl}
                alt="Tournament Logo"
                onError={() => setLeftImageError(true)}
                className={`h-full w-auto max-w-full object-contain ${getImageClasses()}`}
              />
            </div>
          ) : (
            <div className="flex h-11 items-center gap-2.5 rounded-2xl border border-slate-700/80 bg-slate-950/90 px-4 backdrop-blur-xl shadow-xl">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span className="font-broadcast text-xs font-black uppercase tracking-widest text-slate-100">
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
        className="fixed right-8 top-7"
      >
        {customLogoUrl && !rightImageError ? (
          <div className={`flex h-14 w-auto max-w-[220px] items-center justify-center rounded-2xl transition-all ${getContainerClasses()}`}>
            <img
              src={customLogoUrl}
              alt="Channel Logo"
              onError={() => setRightImageError(true)}
              className={`h-full w-auto max-w-full object-contain ${getImageClasses()}`}
            />
          </div>
        ) : (
          <div className="flex h-11 items-center gap-2.5 rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-slate-950 via-[#0d1527] to-slate-950 px-4 shadow-[0_8px_25px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 font-broadcast text-xs font-black text-slate-950 shadow">
              NS
            </div>
            <div className="flex flex-col justify-center leading-none">
              <div className="flex items-center gap-1">
                <span className="font-broadcast text-sm font-black tracking-wider text-white">
                  NEX<span className="text-amber-400">SCORE</span>
                </span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              </div>
              <span className="font-sans text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                HD LIVE
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}