"use client";

import { useState } from "react";
import { increment } from "firebase/database";
import { commitActionAtomic } from "@/lib/firebase/actions";
import { useFootballClock } from "@/lib/hooks/useFootballClock";
import type { FootballCard, FootballEvent, MatchData } from "@/lib/types/match";

export function useFootballScoring(matchData: MatchData | null) {
  const [isProcessing, setIsProcessing] = useState(false);

  const meta = matchData?.meta;
  const football = matchData?.football;

  // নোট: hook conditionally কল করা যায় না, তাই matchData null থাকলেও এটা সবসময় কল হবে —
  // useFootballClock নিজেই undefined football সেফভাবে হ্যান্ডেল করে।
  const footballClock = useFootballClock(football);

  // ম্যাচ ক্লক চালু/বন্ধ — epoch-based, প্রতি সেকেন্ডে DB write করে না
  const handleToggleTimer = async () => {
    if (!football || isProcessing) return;
    setIsProcessing(true);
    try {
      if (football.isRunning) {
        const elapsed =
          (football.elapsedSeconds || 0) + (Date.now() - (football.startedAt || Date.now())) / 1000;
        await commitActionAtomic(
          {
            "match/football/isRunning": false,
            "match/football/startedAt": null,
            "match/football/elapsedSeconds": elapsed,
          },
          "Pause Timer",
          {
            "match/football/isRunning": true,
            "match/football/startedAt": football.startedAt,
            "match/football/elapsedSeconds": football.elapsedSeconds || 0,
          }
        );
      } else {
        await commitActionAtomic(
          { "match/football/isRunning": true, "match/football/startedAt": Date.now() },
          "Start Timer",
          { "match/football/isRunning": false, "match/football/startedAt": football.startedAt || null }
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const currentMatchMinute = () => {
    const base = football?.elapsedSeconds || 0;
    const live =
      football?.isRunning && football?.startedAt ? base + (Date.now() - football.startedAt) / 1000 : base;
    return Math.floor(live / 60);
  };

  const pushFootballEvent = (type: FootballEvent["type"], team: "teamA" | "teamB"): FootballEvent => ({
    id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    team,
    minute: currentMatchMinute(),
    timestamp: Date.now(),
  });

  const clearOverlayEvent = (after: string) =>
    setTimeout(
      () => commitActionAtomic({ "match/meta/currentEvent": null }, "Clear Event", { "match/meta/currentEvent": after }),
      4000
    );

  const handleFootballGoal = async (team: "A" | "B") => {
    if (!football || !meta || isProcessing) return;
    setIsProcessing(true);
    try {
      const field = team === "A" ? "scoreA" : "scoreB";
      const teamKey = team === "A" ? "teamA" : "teamB";
      const halfKey = football.currentHalf === 2 ? "half2" : "half1";
      const halfGoalsField = team === "A" ? "goalsA" : "goalsB";
      
      const newEvent = pushFootballEvent("goal", teamKey);
      const newEventIndex = football.events ? football.events.length : 0;

      await commitActionAtomic(
  {
    [`match/football/${field}`]: increment(1),
    [`match/football/${halfKey}/${halfGoalsField}`]: increment(1),
    [`match/football/events/${newEventIndex}`]: newEvent,
    // যদি হাফটাইম পোস্টার অন থাকে, গোল হওয়ার সাথে সাথে লোয়ার-থার্ডে ব্যাক করবে
    ...(meta.activeGraphic && meta.activeGraphic !== "LOWER_THIRD" 
      ? { "match/meta/activeGraphic": "LOWER_THIRD" } 
      : {}),
    "match/meta/currentEvent": "GOAL",
  },
  `Goal Team ${team}`,
  {
    [`match/football/${field}`]: football[field] || 0,
    [`match/football/${halfKey}/${halfGoalsField}`]: football[halfKey]?.[halfGoalsField] || 0,
    [`match/football/events/${newEventIndex}`]: null,
    ...(meta.activeGraphic && meta.activeGraphic !== "LOWER_THIRD" 
      ? { "match/meta/activeGraphic": meta.activeGraphic } 
      : {}),
    "match/meta/currentEvent": meta.currentEvent,
  }
);


      clearOverlayEvent("GOAL");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFootballCard = async (team: "A" | "B", cardType: "yellow" | "red") => {
    if (!football || !meta || isProcessing) return;
    setIsProcessing(true);
    try {
      const field =
        cardType === "red" ? (team === "A" ? "redCardsA" : "redCardsB") : team === "A" ? "yellowCardsA" : "yellowCardsB";
      const teamKey = team === "A" ? "teamA" : "teamB";
      
      const existingCards = football.cards?.[teamKey] || [];
      const newCardIndex = existingCards.length;
      const newCardEntry: FootballCard = { type: cardType, minute: currentMatchMinute(), timestamp: Date.now() };
      
      const newEventIndex = football.events ? football.events.length : 0;
      const newEvent = pushFootballEvent(cardType === "red" ? "red_card" : "yellow_card", teamKey);

      const stateUpdates: Record<string, any> = {
        [`match/football/${field}`]: increment(1),
        [`match/football/cards/${teamKey}/${newCardIndex}`]: newCardEntry, // Index-based update
        [`match/football/events/${newEventIndex}`]: newEvent, // Index-based update
      };
      
      const previousPaths: Record<string, any> = {
        [`match/football/${field}`]: football[field] || 0,
        [`match/football/cards/${teamKey}/${newCardIndex}`]: null,
        [`match/football/events/${newEventIndex}`]: null,
      };

      if (cardType === "red") {
        stateUpdates["match/meta/currentEvent"] = "RED CARD";
        previousPaths["match/meta/currentEvent"] = meta.currentEvent;
      }

      await commitActionAtomic(stateUpdates, `${cardType.toUpperCase()} Card Team ${team}`, previousPaths);
      if (cardType === "red") clearOverlayEvent("RED CARD");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePossessionAdjust = async (team: "A" | "B", delta: number) => {
    if (!football || isProcessing) return;
    setIsProcessing(true);
    try {
      const halfKey = football.currentHalf === 2 ? "half2" : "half1";
      const current = football[halfKey]?.possession || { teamA: 50, teamB: 50 };
      let teamA = current.teamA ?? 50;
      let teamB = current.teamB ?? 50;
      
      if (team === "A") {
        teamA = Math.min(95, Math.max(5, teamA + delta));
        teamB = 100 - teamA;
      } else {
        teamB = Math.min(95, Math.max(5, teamB + delta));
        teamA = 100 - teamB;
      }
      
      await commitActionAtomic(
        { [`match/football/${halfKey}/possession`]: { teamA, teamB } },
        "Adjust Possession",
        { [`match/football/${halfKey}/possession`]: current }
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHalfChange = async (halfName: string) => {
    if (!football || isProcessing) return;
    setIsProcessing(true);
    try {
      const shouldPause = halfName === "HALF TIME" || halfName === "FULL TIME";
      const stateUpdates: Record<string, any> = { "match/football/half": halfName };
      const previousPaths: Record<string, any> = { "match/football/half": football.half };

      // হাফটাইম/ফুলটাইমে টাইমার অটো-পজ হয়ে যায়
      if (shouldPause && football.isRunning) {
        const elapsed = (football.elapsedSeconds || 0) + (Date.now() - (football.startedAt || Date.now())) / 1000;
        stateUpdates["match/football/isRunning"] = false;
        stateUpdates["match/football/startedAt"] = null;
        stateUpdates["match/football/elapsedSeconds"] = elapsed;
        previousPaths["match/football/isRunning"] = true;
        previousPaths["match/football/startedAt"] = football.startedAt;
        previousPaths["match/football/elapsedSeconds"] = football.elapsedSeconds || 0;
      }
      // দ্বিতীয়ার্ধ শুরু হলে currentHalf পয়েন্টার আপডেট হয়, যাতে গোল/পজেশন half2-তে যোগ হয়
      if (halfName === "2ND HALF") {
        stateUpdates["match/football/currentHalf"] = 2;
        previousPaths["match/football/currentHalf"] = football.currentHalf || 1;
      }

      await commitActionAtomic(stateUpdates, `Changed to ${halfName}`, previousPaths);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    footballClock,
    handleToggleTimer,
    handleFootballGoal,
    handleFootballCard,
    handlePossessionAdjust,
    handleHalfChange,
  };
}