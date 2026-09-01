// components/overlay/cricket/EventPopup.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { useEffect, useState } from "react";

type Accent = "crimson" | "gold" | "electric" | "green";

function accentFor(eventText: string): Accent {
  const upper = eventText.toUpperCase();
  if (["WICKET", "RED CARD"].includes(upper)) return "crimson";
  if (["SIX", "50 RUNS", "100 RUNS", "FIFTY", "CENTURY"].includes(upper)) return "gold";
  if (upper === "GOAL") return "green";
  return "electric";
}

const accentMap: Record<Accent, { bg: string; border: string; glow: string; text: string }> = {
  crimson: { bg: "bg-rose-600", border: "border-rose-400", glow: "shadow-[0_0_80px_rgba(225,29,72,0.7)]", text: "text-white" },
  gold: { bg: "bg-amber-400", border: "border-amber-300", glow: "shadow-[0_0_80px_rgba(251,191,36,0.75)]", text: "text-slate-950" },
  electric: { bg: "bg-sky-500", border: "border-sky-300", glow: "shadow-[0_0_80px_rgba(14,165,233,0.7)]", text: "text-white" },
  green: { bg: "bg-emerald-500", border: "border-emerald-300", glow: "shadow-[0_0_80px_rgba(16,185,129,0.7)]", text: "text-slate-950" },
};

export default function EventPopup({ matchId }: { matchId?: string }) {
  const { matchData } = useMatchData(matchId);
  const [eventText, setEventText] = useState<string | null>(null);

  useEffect(() => {
    if (matchData?.meta?.currentEvent) {
      setEventText(matchData.meta.currentEvent);
      const timer = setTimeout(() => setEventText(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [matchData?.meta?.currentEvent]);

  const accent = eventText ? accentMap[accentFor(eventText)] : null;

  return (
    <AnimatePresence>
      {eventText && accent && (
        <motion.div
          initial={{ y: 200, scale: 0.8, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: -200, scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [0.8, 1.08, 1] }}
            transition={{ duration: 0.45 }}
            className={`chyron border-4 ${accent.border} ${accent.bg} ${accent.glow} px-16 py-8`}
          >
            <span className={`font-score text-6xl italic uppercase tracking-widest md:text-8xl font-black ${accent.text}`}>
              {eventText}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}