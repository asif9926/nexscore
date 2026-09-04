// components/overlay/cricket/EventPopup.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMatchContext } from "@/lib/context/MatchDataContext";
import { useEffect, useState, useRef } from "react";
import type { MatchData } from "@/lib/types/match";

type Accent = "crimson" | "gold" | "electric" | "green";

function accentFor(eventText: string): Accent {
  const upper = eventText.toUpperCase();
  if (["WICKET", "RED CARD"].some((k) => upper.includes(k))) return "crimson";
  if (["SIX", "50", "100", "FIFTY", "CENTURY", "YELLOW CARD"].some((k) => upper.includes(k))) return "gold";
  if (upper.includes("GOAL")) return "green";
  return "electric";
}

const accentMap: Record<Accent, { bg: string; border: string; glow: string; text: string; subText: string }> = {
  crimson: { bg: "bg-rose-600", border: "border-rose-400", glow: "shadow-[0_0_80px_rgba(225,29,72,0.7)]", text: "text-white", subText: "text-rose-200 font-bold" },
  gold: { bg: "bg-amber-400", border: "border-amber-300", glow: "shadow-[0_0_80px_rgba(251,191,36,0.75)]", text: "text-slate-950", subText: "text-slate-900 font-extrabold" },
  electric: { bg: "bg-sky-500", border: "border-sky-300", glow: "shadow-[0_0_80px_rgba(14,165,233,0.7)]", text: "text-white", subText: "text-sky-100 font-bold" },
  green: { bg: "bg-emerald-500", border: "border-emerald-300", glow: "shadow-[0_0_80px_rgba(16,185,129,0.7)]", text: "text-slate-950", subText: "text-emerald-950 font-extrabold" },
};

function parseMilestone(eventRaw: string, detail?: string) {
  const raw = eventRaw.trim();
  const upper = raw.toUpperCase();

  if (upper === "50" || upper === "50 RUNS" || upper === "FIFTY") {
    return { title: "FIFTY!", subtitle: detail || "HALF CENTURY REACHED" };
  }
  if (upper === "100" || upper === "100 RUNS" || upper === "CENTURY") {
    return { title: "CENTURY!", subtitle: detail || "MAGNIFICENT 100 RUNS" };
  }
  if (upper === "WICKET") {
    return { title: "WICKET!", subtitle: detail || "DISMISSAL" };
  }
  if (upper === "SIX") {
    return { title: "MAXIMUM!", subtitle: "6 RUNS" };
  }
  if (upper === "FOUR") {
    return { title: "BOUNDARY!", subtitle: "4 RUNS" };
  }
  if (upper === "GOAL") {
    return { title: "GOAL!", subtitle: detail ? `⚽ ${detail.toUpperCase()}` : "SPECTACULAR FINISH" };
  }
  if (upper === "RED CARD") {
    return { title: "RED CARD!", subtitle: detail ? `🟥 ${detail.toUpperCase()} (SENT OFF)` : "SENDING OFF" };
  }
  if (upper === "YELLOW CARD") {
    return { title: "YELLOW CARD!", subtitle: detail ? `🟨 ${detail.toUpperCase()}` : "OFFICIAL BOOKING" };
  }

  return { title: raw, subtitle: detail || null };
}

export default function EventPopup({ matchData: propMatchData }: { matchData?: MatchData | null }) {
  let contextMatchData: MatchData | null = null;
  try {
    const context = useMatchContext();
    contextMatchData = context.matchData;
  } catch {}

  const matchData = propMatchData || contextMatchData;
  const [eventData, setEventData] = useState<{ text: string; detail?: string; id: string | number } | null>(null);
  const lastProcessedEventKeyRef = useRef<string | null>(null);

  const currentEvent = matchData?.meta?.currentEvent;
  const eventTimestamp = (matchData?.meta as any)?.eventTimestamp;
  const eventDetail = (matchData?.meta as any)?.eventDetail;

  useEffect(() => {
    // 🛡️ currentEvent না থাকলে বা নির্দিষ্ট eventTimestamp না থাকলে কোনো পপআপ দেখাবে না
    if (!currentEvent || !eventTimestamp) {
      setEventData(null);
      return;
    }

    const eventKey = `${currentEvent}_${eventTimestamp}`;
    if (lastProcessedEventKeyRef.current === eventKey) {
      return;
    }

    lastProcessedEventKeyRef.current = eventKey;
    setEventData({
      text: currentEvent,
      detail: eventDetail,
      id: eventKey,
    });

    const timer = setTimeout(() => {
      setEventData(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentEvent, eventTimestamp, eventDetail]);

  const accent = eventData ? accentMap[accentFor(eventData.text)] : null;
  const parsed = eventData ? parseMilestone(eventData.text, eventData.detail) : null;

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
            className={`flex flex-col items-center justify-center border-4 ${accent.border} ${accent.bg} ${accent.glow} min-w-[320px] max-w-[90vw] px-12 py-6 text-center shadow-2xl rounded-3xl`}
          >
            <span className={`font-score text-6xl italic uppercase tracking-widest md:text-8xl font-black ${accent.text} drop-shadow-md`}>
              {parsed.title}
            </span>
            {parsed.subtitle && (
              <span className={`font-broadcast mt-2 text-sm md:text-base uppercase tracking-[0.2em] ${accent.subText}`}>
                {parsed.subtitle}
              </span>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}