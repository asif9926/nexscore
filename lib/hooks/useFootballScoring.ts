// lib/hooks/useFootballScoring.ts
"use client";

import { useState } from "react";
import { commitActionAtomic } from "@/lib/firebase/actions";
import { useToast } from "@/lib/context/ToastContext";
import { useFootballClock } from "./useFootballClock";
import type { MatchData, FootballEvent, FootballCard } from "@/lib/types/match";
import { safeArray } from "@/lib/utils";
import { rtdb } from "@/lib/firebase/client";
import { ref, get, update } from "firebase/database";

export function useFootballScoring(matchData: MatchData | null) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const matchId = matchData?.id || (matchData?.meta as any)?.id || "";
  const football = matchData?.football;
  const footballClock = useFootballClock(football);

  // ১. টাইমার টগল
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
      showToast("টাইমার আপডেট ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ২. হাফ পরিবর্তন
  const handleHalfChange = async (halfLabel: string) => {
    if (!matchId || !football || isProcessing) return;
    setIsProcessing(true);

    try {
      const now = Date.now();
      const isSecondHalf = halfLabel === "2ND HALF";
      const isHalfTime = halfLabel === "HALF TIME";
      const isFullTime = halfLabel === "FULL TIME";

      const liveAddedSeconds =
        football.isRunning && football.startedAt ? Math.floor((now - football.startedAt) / 1000) : 0;
      let newElapsed = (football.elapsedSeconds || 0) + liveAddedSeconds;

      let newIsRunning = football.isRunning;
      let newStartedAt = football.startedAt;

      if (isSecondHalf && newElapsed < 45 * 60) {
        newElapsed = 45 * 60;
      }

      if (isHalfTime || isFullTime) {
        newIsRunning = false;
        newStartedAt = null;
      }

      const updates: Record<string, any> = {
        [`matches/${matchId}/football/half`]: halfLabel,
        [`matches/${matchId}/football/currentHalf`]: isSecondHalf || isFullTime ? 2 : 1,
        [`matches/${matchId}/football/isRunning`]: newIsRunning,
        [`matches/${matchId}/football/startedAt`]: newStartedAt,
        [`matches/${matchId}/football/elapsedSeconds`]: newElapsed,
      };

      await commitActionAtomic(matchId, updates, `Change Half to ${halfLabel}`, matchData);
      showToast(`হাফ পরিবর্তিত: ${halfLabel}`, "info");
    } catch (error) {
      console.error("Failed to change half:", error);
      showToast("হাফ পরিবর্তন ব্যর্থ হয়েছে।", "error");
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
      minute?: number;
    }
  ) => {
    if (!matchId || !football || isProcessing) return;
    setIsProcessing(true);

    try {
      const now = Date.now();
      const goalMinute = details.minute || footballClock.minute;
      const currentScoreA = football.scoreA || 0;
      const currentScoreB = football.scoreB || 0;

      const newScoreA = team === "A" ? currentScoreA + 1 : currentScoreA;
      const newScoreB = team === "B" ? currentScoreB + 1 : currentScoreB;

      const currentHalfKey = football.currentHalf === 2 ? "half2" : "half1";
      const currentHalfData = football[currentHalfKey] || { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } };

      const updatedHalf = {
        ...currentHalfData,
        goalsA: team === "A" ? (currentHalfData.goalsA || 0) + 1 : currentHalfData.goalsA || 0,
        goalsB: team === "B" ? (currentHalfData.goalsB || 0) + 1 : currentHalfData.goalsB || 0,
        possession: currentHalfData.possession || { teamA: 50, teamB: 50 },
      };

      const newEvent: FootballEvent = {
        id: `ev_${now}_${Math.random().toString(36).substring(2, 7)}`,
        type: "goal",
        team: team === "A" ? "teamA" : "teamB",
        minute: goalMinute,
        timestamp: now,
        scorerId: details.scorerId,
        scorerName: details.scorerName,
      };

      if (details.assistId) newEvent.assistId = details.assistId;
      if (details.assistName) newEvent.assistName = details.assistName;

      const updatedEvents = [...safeArray<FootballEvent>(football.events), newEvent];

      // 🛡️ নির্দিষ্ট eventTimestamp ও eventDetail সেভ করা
      const updates = {
        [`matches/${matchId}/football/score${team}`]: team === "A" ? newScoreA : newScoreB,
        [`matches/${matchId}/football/${currentHalfKey}`]: updatedHalf,
        [`matches/${matchId}/football/events`]: updatedEvents,
        [`matches/${matchId}/meta/currentEvent`]: "GOAL",
        [`matches/${matchId}/meta/eventTimestamp`]: now,
        [`matches/${matchId}/meta/eventDetail`]: details.scorerName || null,
      };

      await commitActionAtomic(matchId, updates, `Goal for Team ${team} by ${details.scorerName}`, matchData);
      showToast(`⚽ GOAL! ${details.scorerName} (${goalMinute}')`, "success");

      // 🛡️ ৪.৫ সেকেন্ড পর ডেটাবেস থেকে ইভেন্ট অটো-রিসেট (ঘোস্ট পপআপ চিরতরে বন্ধ)
      setTimeout(async () => {
        try {
          const snap = await get(ref(rtdb, `matches/${matchId}/meta/eventTimestamp`));
          if (snap.val() === now) {
            await update(ref(rtdb), {
              [`matches/${matchId}/meta/currentEvent`]: null,
              [`matches/${matchId}/meta/eventTimestamp`]: null,
              [`matches/${matchId}/meta/eventDetail`]: null,
            });
          }
        } catch {}
      }, 4500);
    } catch (error) {
      console.error("Error recording goal:", error);
      showToast("গোল যোগ করতে ব্যর্থ হয়েছে।", "error");
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
      minute?: number;
    }
  ) => {
    if (!matchId || !football || isProcessing) return;
    setIsProcessing(true);

    try {
      const now = Date.now();
      const cardMinute = details.minute || footballClock.minute;
      const isRed = details.cardType === "red";
      const cardEventName = isRed ? "RED CARD" : "YELLOW CARD";

      const currentRed = team === "A" ? football.redCardsA || 0 : football.redCardsB || 0;
      const currentYellow = team === "A" ? football.yellowCardsA || 0 : football.yellowCardsB || 0;

      const newEvent: FootballEvent = {
        id: `ev_${now}_${Math.random().toString(36).substring(2, 7)}`,
        type: isRed ? "red_card" : "yellow_card",
        team: team === "A" ? "teamA" : "teamB",
        minute: cardMinute,
        timestamp: now,
        playerId: details.playerId,
        playerName: details.playerName,
        cardType: details.cardType,
      };

      const updatedEvents = [...safeArray<FootballEvent>(football.events), newEvent];

      const teamKey = team === "A" ? "teamA" : "teamB";
      const currentTeamCards = safeArray<FootballCard>(football.cards?.[teamKey]);
      const newCard: FootballCard = {
        type: details.cardType,
        minute: cardMinute,
        timestamp: now,
        playerId: details.playerId,
        playerName: details.playerName,
      };

      // 🛡️ নির্দিষ্ট কার্ড নাম ও প্লেয়ার নাম পুশ
      const updates: Record<string, any> = {
        [`matches/${matchId}/football/${isRed ? "redCards" : "yellowCards"}${team}`]: isRed ? currentRed + 1 : currentYellow + 1,
        [`matches/${matchId}/football/events`]: updatedEvents,
        [`matches/${matchId}/football/cards/${teamKey}`]: [...currentTeamCards, newCard],
        [`matches/${matchId}/meta/currentEvent`]: cardEventName,
        [`matches/${matchId}/meta/eventTimestamp`]: now,
        [`matches/${matchId}/meta/eventDetail`]: details.playerName || null,
      };

      await commitActionAtomic(matchId, updates, `${isRed ? "Red" : "Yellow"} Card for ${details.playerName}`, matchData);
      showToast(`${isRed ? "🟥 লাল কার্ড" : "🟨 হলুদ কার্ড"} — ${details.playerName}`, isRed ? "error" : "info");

      // 🛡️ ৪.৫ সেকেন্ড পর কার্ড ইভেন্ট অটো-রিসেট
      setTimeout(async () => {
        try {
          const snap = await get(ref(rtdb, `matches/${matchId}/meta/eventTimestamp`));
          if (snap.val() === now) {
            await update(ref(rtdb), {
              [`matches/${matchId}/meta/currentEvent`]: null,
              [`matches/${matchId}/meta/eventTimestamp`]: null,
              [`matches/${matchId}/meta/eventDetail`]: null,
            });
          }
        } catch {}
      }, 4500);
    } catch (error) {
      console.error("Error recording card:", error);
      showToast("কার্ড যোগ করতে ব্যর্থ হয়েছে।", "error");
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
      const currentPossession = halfData.possession || { teamA: 50, teamB: 50 };

      const currentVal = team === "A" ? currentPossession.teamA : currentPossession.teamB;
      const targetVal = Math.min(95, Math.max(5, currentVal + delta));

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