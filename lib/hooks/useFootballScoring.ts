// lib/hooks/useFootballScoring.ts
"use client";

import { useState } from "react";
import { commitActionAtomic } from "@/lib/firebase/actions";
import { useToast } from "@/lib/context/ToastContext";
import { useFootballClock } from "./useFootballClock";
import type { MatchData } from "@/lib/types/match";

export function useFootballScoring(matchData: MatchData | null) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const matchId =
    (matchData as any)?.id ||
    (matchData?.meta as any)?.id ||
    (typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean).pop() : "");

  const football = matchData?.football;
  const footballClock = useFootballClock(football);

  // ১. টাইমার টগল (স্টার্ট / পজ)
  const handleToggleTimer = async () => {
    if (!matchId || !football || isProcessing) return;
    setIsProcessing(true);

    try {
      const isCurrentlyRunning = !!football.isRunning;
      const now = Date.now();

      let updates: Record<string, any> = {};

      if (isCurrentlyRunning) {
        const additional = football.startedAt ? Math.floor((now - football.startedAt) / 1000) : 0;
        const totalElapsed = (football.elapsedSeconds || 0) + additional;

        updates = {
          [`matches/${matchId}/football/isRunning`]: false,
          [`matches/${matchId}/football/startedAt`]: null,
          [`matches/${matchId}/football/elapsedSeconds`]: totalElapsed,
        };
      } else {
        updates = {
          [`matches/${matchId}/football/isRunning`]: true,
          [`matches/${matchId}/football/startedAt`]: now,
        };
      }

      await commitActionAtomic(matchId, updates, "Toggle Football Clock", matchData);
    } catch (error) {
      console.error("Failed to toggle timer:", error);
      showToast("Timer update failed.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ২. হাফ পরিবর্তন (রানিং টাইম যোগ করা নিশ্চিত)
  const handleHalfChange = async (halfLabel: string) => {
    if (!matchId || !football || isProcessing) return;
    setIsProcessing(true);

    try {
      const now = Date.now();
      const isSecondHalf = halfLabel === "2ND HALF";
      const isHalfTime = halfLabel === "HALF TIME";
      const isFullTime = halfLabel === "FULL TIME";

      // 🛡️ FIX: রানিং থাকা অবস্থায় হাফ পরিবর্তন করলে অতিরিক্ত সময় হিসাব করা
      const liveAddedSeconds =
        football.isRunning && football.startedAt ? Math.floor((now - football.startedAt) / 1000) : 0;
      let newElapsed = (football.elapsedSeconds || 0) + liveAddedSeconds;

      let newIsRunning = football.isRunning;
      let newStartedAt = football.startedAt;

      if (isSecondHalf && newElapsed < 45 * 60) {
        newElapsed = 45 * 60; // ৪৫ মিনিটে শুরু
      }

      if (isHalfTime || isFullTime) {
        newIsRunning = false;
        newStartedAt = null;
      }

      const updates = {
        [`matches/${matchId}/football/half`]: halfLabel,
        [`matches/${matchId}/football/currentHalf`]: isSecondHalf || isFullTime ? 2 : 1,
        [`matches/${matchId}/football/isRunning`]: newIsRunning,
        [`matches/${matchId}/football/startedAt`]: newStartedAt,
        [`matches/${matchId}/football/elapsedSeconds`]: newElapsed,
      };

      await commitActionAtomic(matchId, updates, `Change Half to ${halfLabel}`, matchData);
      showToast(`Half changed to ${halfLabel}`, "info");
    } catch (error) {
      console.error("Failed to change half:", error);
      showToast("Failed to change half.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ৩. আন্তর্জাতিক মানের গোল হ্যান্ডলিং
  const recordGoalWithDetails = async (
    team: "A" | "B",
    details: {
      scorerId: string;
      scorerName: string;
      assistId?: string;
      assistName?: string;
      minute: number;
    }
  ) => {
    if (!matchId || !football || isProcessing) return;
    setIsProcessing(true);

    try {
      const now = Date.now();
      const currentScoreA = football.scoreA || 0;
      const currentScoreB = football.scoreB || 0;

      const newScoreA = team === "A" ? currentScoreA + 1 : currentScoreA;
      const newScoreB = team === "B" ? currentScoreB + 1 : currentScoreB;

      const currentHalfKey = football.currentHalf === 2 ? "half2" : "half1";
      const halfData = football[currentHalfKey] || { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } };

      const updatedHalf = {
        ...halfData,
        goalsA: team === "A" ? (halfData.goalsA || 0) + 1 : halfData.goalsA || 0,
        goalsB: team === "B" ? (halfData.goalsB || 0) + 1 : halfData.goalsB || 0,
      };

      const newEvent = {
        id: `ev_${now}_${Math.random().toString(36).substring(2, 6)}`,
        type: "goal",
        team: team === "A" ? "teamA" : "teamB",
        minute: details.minute,
        scorerId: details.scorerId,
        scorerName: details.scorerName,
        assistId: details.assistId || null,
        assistName: details.assistName || null,
        timestamp: now,
      };

      const updatedEvents = [...(football.events || []), newEvent];

      const updates = {
        [`matches/${matchId}/football/score${team}`]: team === "A" ? newScoreA : newScoreB,
        [`matches/${matchId}/football/${currentHalfKey}`]: updatedHalf,
        [`matches/${matchId}/football/events`]: updatedEvents,
        [`matches/${matchId}/meta/currentEvent`]: "GOAL",
      };

      await commitActionAtomic(matchId, updates, `Goal for Team ${team} by ${details.scorerName}`, matchData);
      showToast(`⚽ GOAL! ${details.scorerName} (${details.minute}')`, "success");
    } catch (error) {
      console.error("Error recording goal:", error);
      showToast("Failed to record goal.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ৪. ডিসিপ্লিনারি কার্ড হ্যান্ডলিং
  const recordCardWithDetails = async (
    team: "A" | "B",
    details: {
      playerId: string;
      playerName: string;
      cardType: "yellow" | "red";
      minute: number;
    }
  ) => {
    if (!matchId || !football || isProcessing) return;
    setIsProcessing(true);

    try {
      const now = Date.now();
      const isRed = details.cardType === "red";

      const currentRed = team === "A" ? football.redCardsA || 0 : football.redCardsB || 0;
      const currentYellow = team === "A" ? football.yellowCardsA || 0 : football.yellowCardsB || 0;

      const newEvent = {
        id: `ev_${now}_${Math.random().toString(36).substring(2, 6)}`,
        type: isRed ? "red_card" : "yellow_card",
        team: team === "A" ? "teamA" : "teamB",
        minute: details.minute,
        playerId: details.playerId,
        playerName: details.playerName,
        timestamp: now,
      };

      const updatedEvents = [...(football.events || []), newEvent];

      const updates: Record<string, any> = {
        [`matches/${matchId}/football/${isRed ? "redCards" : "yellowCards"}${team}`]: isRed ? currentRed + 1 : currentYellow + 1,
        [`matches/${matchId}/football/events`]: updatedEvents,
        [`matches/${matchId}/meta/currentEvent`]: isRed ? "RED CARD" : "YELLOW CARD",
      };

      await commitActionAtomic(matchId, updates, `${isRed ? "Red" : "Yellow"} Card for ${details.playerName}`, matchData);
      showToast(`${isRed ? "🟥 Red Card" : "🟨 Yellow Card"} — ${details.playerName}`, isRed ? "error" : "info");
    } catch (error) {
      console.error("Error recording card:", error);
      showToast("Failed to record card.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ৫. পজেশন অ্যাডজাস্টমেন্ট
  const handlePossessionAdjust = async (team: "A" | "B", delta: number) => {
    if (!matchId || !football || isProcessing) return;
    setIsProcessing(true);

    try {
      const currentHalfKey = football.currentHalf === 2 ? "half2" : "half1";
      const halfData = football[currentHalfKey] || { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } };

      let currentVal = team === "A" ? halfData.possession.teamA : halfData.possession.teamB;
      let targetVal = Math.min(95, Math.max(5, currentVal + delta));

      const newPossession = {
        teamA: team === "A" ? targetVal : 100 - targetVal,
        teamB: team === "B" ? targetVal : 100 - targetVal,
      };

      const updates = {
        [`matches/${matchId}/football/${currentHalfKey}/possession`]: newPossession,
      };

      await commitActionAtomic(matchId, updates, "Adjust Possession", matchData);
    } catch (error) {
      console.error("Failed to adjust possession:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    footballClock,
    isProcessing,
    handleToggleTimer,
    handleHalfChange,
    recordGoalWithDetails,
    recordCardWithDetails,
    handlePossessionAdjust,
  };
}