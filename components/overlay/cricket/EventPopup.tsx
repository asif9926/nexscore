// components/overlay/cricket/EventPopup.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMatchData } from "@/lib/hooks/useMatchData";
import { useEffect, useState, useRef } from "react";

type Accent = "crimson" | "gold" | "electric" | "green";

function accentFor(eventText: string): Accent {
  const upper = eventText.toUpperCase();
  if (["WICKET", "RED CARD"].some((k) => upper.includes(k))) return "crimson";
  if (["SIX", "50", "100", "FIFTY", "CENTURY", "YELLOW CARD"].some((k) => upper.includes(k))) return "gold";
  if (upper.includes("GOAL")) return "green";
  return "electric";
}

const accentMap: Record<Accent, { bg: string; border: string; glow: string; text: string; subText: string }> = {
  crimson: { bg: "bg-rose-600", border: "border-rose-400", glow: "shadow-[0_0_80px_rgba(225,29,72,0.7)]", text: "text-white", subText: "text-rose-200" },
  gold: { bg: "bg-amber-400", border: "border-amber-300", glow: "shadow-[0_0_80px_rgba(251,191,36,0.75)]", text: "text-slate-950", subText: "text-slate-900 font-extrabold" },
  electric: { bg: "bg-sky-500", border: "border-sky-300", glow: "shadow-[0_0_80px_rgba(14,165,233,0.7)]", text: "text-white", subText: "text-sky-100" },
  green: { bg: "bg-emerald-500", border: "border-emerald-300", glow: "shadow-[0_0_80px_rgba(16,185,129,0.7)]", text: "text-slate-950", subText: "text-emerald-950 font-extrabold" },
};

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
  if (upper === "GOAL") {
    return { title: "GOAL!", subtitle: "SPECTACULAR FINISH" };
  }
  if (upper === "RED CARD") {
    return { title: "RED CARD!", subtitle: "SENDING OFF" };
  }
  if (upper === "YELLOW CARD") {
    return { title: "YELLOW CARD!", subtitle: "OFFICIAL BOOKING" };
  }

  return { title: raw, subtitle: null };
}

export default function EventPopup({ matchId }: { matchId?: string }) {
  const { matchData } = useMatchData(matchId);
  const [eventData, setEventData] = useState<{ text: string; id: string | number } | null>(null);

  const lastProcessedEventKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const currentEvent = matchData?.meta?.currentEvent;
    if (!currentEvent) {
      setEventData(null);
      return;
    }

    // ক্রিকেট ও ফুটবল ইভেন্টের নির্ভরযোগ্য টাইমস্ট্যাম্প সংগ্রহ
    const recentBalls = matchData?.cricket?.currentInnings === 2 
      ? matchData?.cricket?.innings2?.recentBalls 
      : matchData?.cricket?.innings1?.recentBalls;
    const latestCricketBallTime = Array.isArray(recentBalls) && recentBalls.length > 0 
      ? (recentBalls[recentBalls.length - 1] as any)?.timestamp 
      : 0;

    const latestFootballEventTime = Array.isArray(matchData?.football?.events) && matchData.football.events.length > 0
      ? matchData.football.events[matchData.football.events.length - 1]?.timestamp
      : 0;

    const eventMarkerTime = (matchData?.meta as any)?.eventTimestamp 
      || latestCricketBallTime 
      || latestFootballEventTime 
      || matchData?.meta?.updatedAt 
      || 0;

    const eventKey = `${currentEvent}_${eventMarkerTime}`;

    // একই ইভেন্ট বারবার লুপ হওয়া ঠেকানো
    if (lastProcessedEventKeyRef.current === eventKey) {
      return;
    }

    lastProcessedEventKeyRef.current = eventKey;
    setEventData({
      text: currentEvent,
      id: eventKey,
    });

    const timer = setTimeout(() => {
      setEventData(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [matchData?.meta?.currentEvent, matchData?.cricket, matchData?.football?.events]);

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
            className={`flex flex-col items-center justify-center border-4 ${accent.border} ${accent.bg} ${accent.glow} min-w-[320px] px-16 py-6 text-center shadow-2xl rounded-2xl`}
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