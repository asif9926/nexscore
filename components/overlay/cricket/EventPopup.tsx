// components/overlay/cricket/EventPopup.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { useEffect, useState, useRef } from "react";

type Accent = "crimson" | "gold" | "electric" | "green";

function accentFor(eventText: string): Accent {
  const upper = eventText.toUpperCase();
  if (["WICKET", "RED CARD"].some((k) => upper.includes(k))) return "crimson";
  if (["SIX", "50", "100", "FIFTY", "CENTURY"].some((k) => upper.includes(k))) return "gold";
  if (upper.includes("GOAL")) return "green";
  return "electric";
}

const accentMap: Record<Accent, { bg: string; border: string; glow: string; text: string; subText: string }> = {
  crimson: { bg: "bg-rose-600", border: "border-rose-400", glow: "shadow-[0_0_80px_rgba(225,29,72,0.7)]", text: "text-white", subText: "text-rose-200" },
  gold: { bg: "bg-amber-400", border: "border-amber-300", glow: "shadow-[0_0_80px_rgba(251,191,36,0.75)]", text: "text-slate-950", subText: "text-slate-900 font-extrabold" },
  electric: { bg: "bg-sky-500", border: "border-sky-300", glow: "shadow-[0_0_80px_rgba(14,165,233,0.7)]", text: "text-white", subText: "text-sky-100" },
  green: { bg: "bg-emerald-500", border: "border-emerald-300", glow: "shadow-[0_0_80px_rgba(16,185,129,0.7)]", text: "text-slate-950", subText: "text-emerald-950 font-extrabold" },
};

// 🎯 ইভেন্টের টাইটেল ও সাব-হেডিং ফরম্যাটার
function parseMilestone(eventRaw: string) {
  const raw = eventRaw.trim();
  const upper = raw.toUpperCase();

  if (upper === "50" || upper === "50 RUNS" || upper === "FIFTY") {
    return { title: "FIFTY!", subtitle: "HALF CENTURY REACHED" };
  }
  if (upper === "100" || upper === "100 RUNS" || upper === "CENTURY") {
    return { title: "CENTURY!", subtitle: "MAGNIFICENT 100 RUNS" };
  }
  if (upper === "WICKET") {
    return { title: "WICKET!", subtitle: "DISMISSAL" };
  }
  if (upper === "SIX") {
    return { title: "MAXIMUM!", subtitle: "6 RUNS" };
  }
  if (upper === "FOUR") {
    return { title: "BOUNDARY!", subtitle: "4 RUNS" };
  }

  return { title: raw, subtitle: null };
}

export default function EventPopup({ matchId }: { matchId?: string }) {
  const { matchData } = useMatchData(matchId);
  const [eventData, setEventData] = useState<{ text: string; id: string | number } | null>(null);

  const lastProcessedEventRef = useRef<string | null>(null);

  useEffect(() => {
    const currentEvent = matchData?.meta?.currentEvent;

    if (!currentEvent) {
      lastProcessedEventRef.current = null;
      setEventData(null);
      return;
    }

    const eventTime = (matchData?.meta as any)?.eventTimestamp || matchData?.meta?.updatedAt || 0;
    const eventKey = `${currentEvent}_${eventTime}`;

    if (lastProcessedEventRef.current === eventKey) {
      return;
    }

    if (eventTime && Date.now() - eventTime > 5000) {
      return;
    }

    lastProcessedEventRef.current = eventKey;
    setEventData({
      text: currentEvent,
      id: eventKey,
    });

    const timer = setTimeout(() => {
      setEventData(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [matchData?.meta?.currentEvent, (matchData?.meta as any)?.eventTimestamp]);

  const accent = eventData ? accentMap[accentFor(eventData.text)] : null;
  const parsed = eventData ? parseMilestone(eventData.text) : null;

  return (
    <AnimatePresence mode="wait">
      {eventData && accent && parsed && (
        <motion.div
          key={`event-${eventData.id}`}
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
            className={`chyron flex flex-col items-center justify-center border-4 ${accent.border} ${accent.bg} ${accent.glow} min-w-[280px] px-16 py-6 text-center`}
          >
            <span className={`font-score text-6xl italic uppercase tracking-widest md:text-8xl font-black ${accent.text}`}>
              {parsed.title}
            </span>
            {parsed.subtitle && (
              <span className={`font-broadcast mt-1 text-sm md:text-base font-black uppercase tracking-[0.25em] ${accent.subText}`}>
                {parsed.subtitle}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}