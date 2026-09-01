// lib/hooks/useCricketScoring.ts
"use client";

import { useState } from "react";
import { ref, update, get, set } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { useToast } from "@/lib/context/ToastContext";
import type { MatchData, Batsman, Bowler, FallOfWicket } from "@/lib/types/match";
import { safeArray } from "@/lib/utils";
import {
  generateRunCommentary,
  generateWicketCommentary,
  generateExtraCommentary,
} from "@/lib/utils/commentaryGenerator";

// ==========================================
// 🏏 CRICKET MATH & SCORING HELPER UTILITIES
// ==========================================

const addBallToOvers = (oversStr: string = "0.0"): string => {
  const [overs, balls] = (oversStr || "0.0").split(".").map(Number);
  const totalBalls = (overs || 0) * 6 + (balls || 0) + 1;
  const newOvers = Math.floor(totalBalls / 6);
  const newBalls = totalBalls % 6;
  return `${newOvers}.${newBalls}`;
};

const oversToTotalBalls = (oversStr: string = "0.0"): number => {
  const [overs, balls] = (oversStr || "0.0").split(".").map(Number);
  return (overs || 0) * 6 + (balls || 0);
};

const calculateRunRate = (score: number, oversStr: string = "0.0"): number => {
  const totalBalls = oversToTotalBalls(oversStr);
  if (totalBalls === 0) return 0;
  return Number(((score / totalBalls) * 6).toFixed(2));
};

const checkAndCalculateMaidenOver = (
  bowlerRecentDeliveries: any[],
  currentBowlerOvers: string
): boolean => {
  if (!currentBowlerOvers.endsWith(".0") || currentBowlerOvers === "0.0") {
    return false;
  }
  const lastOverDeliveries = bowlerRecentDeliveries.slice(-6);
  if (lastOverDeliveries.length < 6) return false;

  const totalConceded = lastOverDeliveries.reduce((sum, d) => {
    const runs = typeof d === "object" ? d.runs || 0 : Number(d) || 0;
    return sum + runs;
  }, 0);

  return totalConceded === 0;
};

// ==========================================
// 🎯 MAIN CUSTOM HOOK: useCricketScoring
// ==========================================

export function useCricketScoring(matchData: MatchData | null) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals Controller States
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isNewBowlerModalOpen, setIsNewBowlerModalOpen] = useState(false);
  const [isInningsBreakModalOpen, setIsInningsBreakModalOpen] = useState(false);

  // Match & Innings Context
  const matchId =
    (matchData as any)?.id ||
    (matchData?.meta as any)?.id ||
    (typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean).pop() : "");

  const cricket = matchData?.cricket;
  const currentInningsNum = cricket?.currentInnings || 1;
  const currentInningsKey = currentInningsNum === 2 ? "innings2" : "innings1";
  const currentInnings = cricket?.[currentInningsKey];

  const battingTeamKey = (currentInnings?.battingTeam || "teamA") as "teamA" | "teamB";
  const bowlingTeamKey: "teamA" | "teamB" = battingTeamKey === "teamA" ? "teamB" : "teamA";

  const battingTeamName = matchData?.meta?.[battingTeamKey] || "Batting Team";
  const bowlingTeamName = matchData?.meta?.[bowlingTeamKey] || "Bowling Team";

  const battingSquad = cricket?.squads?.[battingTeamKey] || [];
  const bowlingSquad = cricket?.squads?.[bowlingTeamKey] || [];

  const activeBatsmen = safeArray<Batsman>(currentInnings?.batsmen).filter((b) => !b.isOut);
  const availableBatsmen = battingSquad.filter(
    (p) => !safeArray<Batsman>(currentInnings?.batsmen).some((b) => b.id === p.id)
  );

  const bowlersList = safeArray<Bowler>(currentInnings?.bowlers);

  // 🛡️ Active Bowler Resolver (বোলার লক প্রিভেন্ট করার নির্ভুল লজিক)
  const activeBowlerObj =
    bowlersList.find((b) => b.isActive) ||
    (currentInnings?.overs === "0.0" && bowlersList.length > 0 ? bowlersList[0] : undefined);

  // Atomic Undo Snapshot Logger (Per Match)
  const saveUndoSnapshot = async (currentMatch: any) => {
    if (!matchId) return;
    try {
      const logRef = ref(rtdb, `match_actionLogs/${matchId}`);
      const snap = await get(logRef);
      const history = snap.exists() ? snap.val() : [];
      const newHistory = Array.isArray(history) ? history : Object.values(history);

      newHistory.push({
        state: currentMatch,
        timestamp: Date.now(),
      });

      if (newHistory.length > 25) newHistory.shift();
      await set(logRef, newHistory);
    } catch (e) {
      console.error("Undo Snapshot Error:", e);
    }
  };

  // ==========================================
  // 1️⃣ HANDLE RUNS (DOT, 1, 2, 3, 4, 5, 6)
  // ==========================================
  const handleRuns = async (runs: number) => {
    if (isProcessing || !matchId || !matchData || !currentInnings || currentInnings.isCompleted) return;

    if (!activeBowlerObj) {
      setIsNewBowlerModalOpen(true);
      showToast("নতুন ওভারের প্রথম বল করার আগে বোলার নির্বাচন করুন।", "error");
      return;
    }

    const striker = activeBatsmen.find((b) => b.onStrike);
    const nonStriker = activeBatsmen.find((b) => !b.onStrike);

    if (!striker || !nonStriker) {
      showToast("উভয় প্রান্তে ব্যাটসম্যান সিলেক্ট করা থাকা আবশ্যক।", "error");
      return;
    }

    setIsProcessing(true);
    try {
      await saveUndoSnapshot(matchData);

      const newScore = (currentInnings.score || 0) + runs;
      const newOvers = addBallToOvers(currentInnings.overs || "0.0");
      const isOverComplete = newOvers.endsWith(".0");
      const bowlerNewOvers = addBallToOvers(activeBowlerObj.overs || "0.0");

      // Batting stats & strike rotation
      const updatedBatsmen = safeArray<Batsman>(currentInnings.batsmen).map((b) => {
        if (b.id === striker.id) {
          const newRuns = (b.runs || 0) + runs;
          const newBalls = (b.balls || 0) + 1;
          const newFours = runs === 4 ? (b.fours || 0) + 1 : b.fours || 0;
          const newSixes = runs === 6 ? (b.sixes || 0) + 1 : b.sixes || 0;

          let stayOnStrike = runs % 2 === 0;
          if (isOverComplete) stayOnStrike = !stayOnStrike;

          return {
            ...b,
            runs: newRuns,
            balls: newBalls,
            fours: newFours,
            sixes: newSixes,
            onStrike: stayOnStrike,
          };
        }
        if (b.id === nonStriker.id) {
          let stayOnStrike = runs % 2 !== 0;
          if (isOverComplete) stayOnStrike = !stayOnStrike;
          return {
            ...b,
            onStrike: stayOnStrike,
          };
        }
        return b;
      });

      // Bowler stats & Maiden check
      const recentDeliveries = [...safeArray(currentInnings.recentBalls), { runs, isWicket: false }];
      const isMaiden = isOverComplete && checkAndCalculateMaidenOver(recentDeliveries, bowlerNewOvers);

      const updatedBowlers = safeArray<Bowler>(currentInnings.bowlers).map((b) => {
        if (b.id === activeBowlerObj.id) {
          return {
            ...b,
            runs: (b.runs || 0) + runs,
            overs: bowlerNewOvers,
            maidens: isMaiden ? (b.maidens || 0) + 1 : b.maidens || 0,
            isActive: !isOverComplete,
          };
        }
        return b;
      });

      // Commentary & Timeline Log
      const ballLog = {
        ballNumber: newOvers,
        runs,
        label: String(runs),
        batsmanName: striker.name,
        bowlerName: activeBowlerObj.name,
        isWicket: false,
        text: generateRunCommentary({
          bowlerName: activeBowlerObj.name,
          batsmanName: striker.name,
          runs,
        }),
        timestamp: Date.now(),
      };
      const updatedRecentBalls = [...safeArray(currentInnings.recentBalls), ballLog];

      const runRate = calculateRunRate(newScore, newOvers);

      let eventText: string | null = null;
      if (runs === 4) eventText = "FOUR";
      if (runs === 6) eventText = "SIX";

      const strikerTotalRuns = (striker.runs || 0) + runs;
      if (strikerTotalRuns >= 50 && (striker.runs || 0) < 50) eventText = "50 RUNS";
      if (strikerTotalRuns >= 100 && (striker.runs || 0) < 100) eventText = "100 RUNS";

      const updates: Record<string, any> = {
        [`matches/${matchId}/cricket/${currentInningsKey}/score`]: newScore,
        [`matches/${matchId}/cricket/${currentInningsKey}/overs`]: newOvers,
        [`matches/${matchId}/cricket/${currentInningsKey}/runRate`]: runRate,
        [`matches/${matchId}/cricket/${currentInningsKey}/batsmen`]: updatedBatsmen,
        [`matches/${matchId}/cricket/${currentInningsKey}/bowlers`]: updatedBowlers,
        [`matches/${matchId}/cricket/${currentInningsKey}/recentBalls`]: updatedRecentBalls,
        [`matches/${matchId}/meta/updatedAt`]: Date.now(),
      };

      if (eventText) updates[`matches/${matchId}/meta/currentEvent`] = eventText;

      const maxOvers = cricket?.maxOvers || 20;
      const target = currentInnings.target;

      if (currentInningsNum === 2 && target && newScore >= target) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/isCompleted`] = true;
        updates[`matches/${matchId}/meta/activeGraphic`] = "RESULT_POSTER";
      } else if (oversToTotalBalls(newOvers) >= maxOvers * 6) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/isCompleted`] = true;
        if (currentInningsNum === 1) {
          setIsInningsBreakModalOpen(true);
        } else {
          updates[`matches/${matchId}/meta/activeGraphic`] = "RESULT_POSTER";
        }
      }

      await update(ref(rtdb), updates);

      if (isOverComplete && oversToTotalBalls(newOvers) < maxOvers * 6) {
        setIsNewBowlerModalOpen(true);
      }
    } catch (err) {
      console.error("Scoring error:", err);
      showToast("স্কোর আপডেট ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 2️⃣ MANUAL STRIKE SWAP
  // ==========================================
  const handleSwapStrike = async () => {
    if (isProcessing || activeBatsmen.length < 2 || !matchId || !matchData || !currentInnings) return;

    setIsProcessing(true);
    try {
      await saveUndoSnapshot(matchData);

      const updatedBatsmen = safeArray<Batsman>(currentInnings.batsmen).map((b) => {
        if (!b.isOut) return { ...b, onStrike: !b.onStrike };
        return b;
      });

      await update(ref(rtdb), {
        [`matches/${matchId}/cricket/${currentInningsKey}/batsmen`]: updatedBatsmen,
        [`matches/${matchId}/meta/updatedAt`]: Date.now(),
      });
      showToast("স্ট্রাইক অদলবদল করা হয়েছে।", "info");
    } catch {
      showToast("স্ট্রাইক পরিবর্তন ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 3️⃣ WICKET ENGINE
  // ==========================================
  const confirmWicket = async (data: {
    outBatsmanId: string;
    newBatsmanId: string;
    dismissalType: string;
    runsCompleted?: number;
    isWideDelivery?: boolean;
  }) => {
    if (isProcessing || !matchId || !matchData || !currentInnings) return;

    if (!activeBowlerObj) {
      setIsNewBowlerModalOpen(true);
      showToast("নতুন ওভার শুরুর আগে বোলার নির্বাচন করুন।", "error");
      return;
    }

    setIsProcessing(true);
    try {
      await saveUndoSnapshot(matchData);

      const runsCompleted = data.runsCompleted || 0;
      const isLegalDelivery = !data.isWideDelivery;
      const extraPenalty = data.isWideDelivery ? 1 : 0;

      const newScore = (currentInnings.score || 0) + runsCompleted + extraPenalty;
      const newWickets = (currentInnings.wickets || 0) + 1;
      const newOvers = isLegalDelivery ? addBallToOvers(currentInnings.overs || "0.0") : currentInnings.overs || "0.0";
      const isOverComplete = isLegalDelivery && newOvers.endsWith(".0");

      const outBatsman = safeArray<Batsman>(currentInnings.batsmen).find((b) => b.id === data.outBatsmanId);
      const isStrikerOut = outBatsman?.onStrike;

      // Update Batsmen
      let updatedBatsmen = safeArray<Batsman>(currentInnings.batsmen).map((b) => {
        if (b.id === data.outBatsmanId) {
          return {
            ...b,
            isOut: true,
            dismissal: data.dismissalType,
            runs: (b.runs || 0) + (isStrikerOut ? runsCompleted : 0),
            balls: isLegalDelivery && isStrikerOut ? (b.balls || 0) + 1 : b.balls || 0,
            onStrike: false,
          };
        }
        if (!b.isOut && b.id !== data.outBatsmanId) {
          let strikeState = b.onStrike;
          if (runsCompleted % 2 !== 0) strikeState = !strikeState;
          if (isOverComplete) strikeState = !strikeState;
          return { ...b, onStrike: strikeState };
        }
        return b;
      });

      // Add new incoming batsman
      if (data.newBatsmanId) {
        const nextPlayer = battingSquad.find((p) => p.id === data.newBatsmanId);
        if (nextPlayer) {
          const newBatsmanObj: Batsman = {
            id: nextPlayer.id,
            name: nextPlayer.name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            onStrike: isStrikerOut ? (runsCompleted % 2 === 0 ? !isOverComplete : isOverComplete) : isOverComplete,
            isOut: false,
          };
          updatedBatsmen.push(newBatsmanObj);
        }
      }

      const isBowlerWicket = ![
        "Run Out",
        "Timed Out",
        "Retired Out",
        "Hit the ball twice",
        "Obstructing the field",
      ].includes(data.dismissalType);

      // Update Bowlers
      const updatedBowlers = safeArray<Bowler>(currentInnings.bowlers).map((b) => {
        if (b.id === activeBowlerObj?.id) {
          return {
            ...b,
            wickets: isBowlerWicket ? (b.wickets || 0) + 1 : b.wickets || 0,
            runs: (b.runs || 0) + runsCompleted + extraPenalty,
            overs: isLegalDelivery ? addBallToOvers(b.overs || "0.0") : b.overs || "0.0",
            isActive: !isOverComplete,
          };
        }
        return b;
      });

      // Fall of Wickets
      const fowEntry: FallOfWicket = {
        score: newScore,
        wicketNumber: newWickets,
        overs: newOvers,
        batsmanName: outBatsman?.name || "Batsman",
      };
      const updatedFOW = [...safeArray(currentInnings.fallOfWickets), fowEntry];

      // Commentary & Timeline Log
      const ballLog = {
        ballNumber: newOvers,
        runs: runsCompleted,
        label: "W",
        batsmanName: outBatsman?.name || "Batsman",
        bowlerName: activeBowlerObj?.name || "Bowler",
        isWicket: true,
        text: generateWicketCommentary({
          bowlerName: activeBowlerObj?.name || "Bowler",
          batsmanName: outBatsman?.name || "Batsman",
          dismissalType: data.dismissalType,
          runsCompleted,
        }),
        timestamp: Date.now(),
      };
      const updatedRecentBalls = [...safeArray(currentInnings.recentBalls), ballLog];

      const maxWickets = Math.max(1, battingSquad.length - 1);
      const isAllOut = newWickets >= maxWickets;

      const updates: Record<string, any> = {
        [`matches/${matchId}/cricket/${currentInningsKey}/score`]: newScore,
        [`matches/${matchId}/cricket/${currentInningsKey}/wickets`]: newWickets,
        [`matches/${matchId}/cricket/${currentInningsKey}/overs`]: newOvers,
        [`matches/${matchId}/cricket/${currentInningsKey}/runRate`]: calculateRunRate(newScore, newOvers),
        [`matches/${matchId}/cricket/${currentInningsKey}/batsmen`]: updatedBatsmen,
        [`matches/${matchId}/cricket/${currentInningsKey}/bowlers`]: updatedBowlers,
        [`matches/${matchId}/cricket/${currentInningsKey}/fallOfWickets`]: updatedFOW,
        [`matches/${matchId}/cricket/${currentInningsKey}/recentBalls`]: updatedRecentBalls,
        [`matches/${matchId}/meta/currentEvent`]: "WICKET",
        [`matches/${matchId}/meta/updatedAt`]: Date.now(),
      };

      if (data.isWideDelivery) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/extras/wide`] =
          (currentInnings.extras?.wide || 0) + 1;
      }

      if (isAllOut) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/isCompleted`] = true;
        if (currentInningsNum === 1) {
          setIsInningsBreakModalOpen(true);
        } else {
          updates[`matches/${matchId}/meta/activeGraphic`] = "RESULT_POSTER";
        }
      }

      await update(ref(rtdb), updates);
      setIsWicketModalOpen(false);

      if (isOverComplete && !isAllOut) {
        setIsNewBowlerModalOpen(true);
      }
    } catch (e) {
      console.error("Wicket error:", e);
      showToast("উইকেট আপডেট ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 4️⃣ EXTRAS ENGINE (WIDE, NO BALL, BYE, LEG BYE)
  // ==========================================
  const confirmExtras = async (data: { type: string; extraRunsRan: number; isFromBat?: boolean }) => {
    if (isProcessing || !matchId || !matchData || !currentInnings) return;

    if (!activeBowlerObj) {
      setIsNewBowlerModalOpen(true);
      showToast("নতুন ওভার শুরুর আগে বোলার নির্বাচন করুন।", "error");
      return;
    }

    setIsProcessing(true);
    try {
      await saveUndoSnapshot(matchData);

      const striker = activeBatsmen.find((b) => b.onStrike);
      const nonStriker = activeBatsmen.find((b) => !b.onStrike);
      const isWide = data.type === "Wide";
      const isNoBall = data.type === "No Ball";
      const isByeLegBye = data.type === "Bye" || data.type === "Leg Bye";

      const penaltyRun = isWide || isNoBall ? 1 : 0;
      const totalRunsFromBall = penaltyRun + (data.extraRunsRan || 0);

      const newScore = (currentInnings.score || 0) + totalRunsFromBall;
      const isLegal = isByeLegBye;
      const newOvers = isLegal ? addBallToOvers(currentInnings.overs || "0.0") : currentInnings.overs || "0.0";
      const isOverComplete = isLegal && newOvers.endsWith(".0");

      // Update Batsmen
      const updatedBatsmen = safeArray<Batsman>(currentInnings.batsmen).map((b) => {
        if (b.id === striker?.id) {
          const batRuns = isNoBall && data.isFromBat ? (b.runs || 0) + data.extraRunsRan : b.runs || 0;
          const ballFaced = isLegal || (isNoBall && data.isFromBat) ? (b.balls || 0) + 1 : b.balls || 0;

          let strikeState = b.onStrike;
          if (data.extraRunsRan % 2 !== 0) strikeState = !strikeState;
          if (isOverComplete) strikeState = !strikeState;

          return { ...b, runs: batRuns, balls: ballFaced, onStrike: strikeState };
        }
        if (b.id === nonStriker?.id) {
          let strikeState = b.onStrike;
          if (data.extraRunsRan % 2 !== 0) strikeState = !strikeState;
          if (isOverComplete) strikeState = !strikeState;
          return { ...b, onStrike: strikeState };
        }
        return b;
      });

      // Update Bowlers
      const bowlerRunsAdded = isWide || isNoBall ? totalRunsFromBall : 0;
      const updatedBowlers = safeArray<Bowler>(currentInnings.bowlers).map((b) => {
        if (b.id === activeBowlerObj?.id) {
          return {
            ...b,
            runs: (b.runs || 0) + bowlerRunsAdded,
            overs: isLegal ? addBallToOvers(b.overs || "0.0") : b.overs || "0.0",
            isActive: !isOverComplete,
          };
        }
        return b;
      });

      // Update Extras Table
      const currentExtras = currentInnings.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0 };
      const updatedExtras = { ...currentExtras };
      if (isWide) updatedExtras.wide = (updatedExtras.wide || 0) + totalRunsFromBall;
      if (isNoBall) updatedExtras.noBall = (updatedExtras.noBall || 0) + (data.isFromBat ? 1 : totalRunsFromBall);
      if (data.type === "Bye") updatedExtras.bye = (updatedExtras.bye || 0) + data.extraRunsRan;
      if (data.type === "Leg Bye") updatedExtras.legBye = (updatedExtras.legBye || 0) + data.extraRunsRan;

      // Commentary & Timeline Log
      const label = `${data.extraRunsRan > 0 ? data.extraRunsRan : ""}${
        data.type === "Wide" ? "Wd" : data.type === "No Ball" ? "Nb" : data.type === "Leg Bye" ? "lb" : "b"
      }`;
      const ballLog = {
        ballNumber: newOvers,
        runs: totalRunsFromBall,
        label,
        batsmanName: striker?.name || "Striker",
        bowlerName: activeBowlerObj?.name || "Bowler",
        isWicket: false,
        text: generateExtraCommentary({
          bowlerName: activeBowlerObj?.name || "Bowler",
          batsmanName: striker?.name || "Striker",
          type: data.type,
          totalRuns: totalRunsFromBall,
        }),
        timestamp: Date.now(),
      };
      const updatedRecentBalls = [...safeArray(currentInnings.recentBalls), ballLog];

      await update(ref(rtdb), {
        [`matches/${matchId}/cricket/${currentInningsKey}/score`]: newScore,
        [`matches/${matchId}/cricket/${currentInningsKey}/overs`]: newOvers,
        [`matches/${matchId}/cricket/${currentInningsKey}/runRate`]: calculateRunRate(newScore, newOvers),
        [`matches/${matchId}/cricket/${currentInningsKey}/extras`]: updatedExtras,
        [`matches/${matchId}/cricket/${currentInningsKey}/batsmen`]: updatedBatsmen,
        [`matches/${matchId}/cricket/${currentInningsKey}/bowlers`]: updatedBowlers,
        [`matches/${matchId}/cricket/${currentInningsKey}/recentBalls`]: updatedRecentBalls,
        [`matches/${matchId}/meta/updatedAt`]: Date.now(),
      });

      setIsExtrasModalOpen(false);

      if (isOverComplete) {
        setIsNewBowlerModalOpen(true);
      }
    } catch {
      showToast("এক্সট্রা যোগ করতে ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 5️⃣ CONFIRM NEW BOWLER
  // ==========================================
  const confirmNewBowler = async (bowlerId: string) => {
    if (isProcessing || !matchId || !matchData || !currentInnings) return;

    setIsProcessing(true);
    try {
      const selectedBowler = bowlingSquad.find((p) => p.id === bowlerId);
      if (!selectedBowler) return;

      const existingBowler = safeArray<Bowler>(currentInnings.bowlers).find((b) => b.id === bowlerId);

      let updatedBowlers: Bowler[];
      if (existingBowler) {
        updatedBowlers = safeArray<Bowler>(currentInnings.bowlers).map((b) => ({
          ...b,
          isActive: b.id === bowlerId,
        }));
      } else {
        const newBowlerObj: Bowler = {
          id: selectedBowler.id,
          name: selectedBowler.name,
          overs: "0.0",
          maidens: 0,
          runs: 0,
          wickets: 0,
          isActive: true,
        };
        updatedBowlers = safeArray<Bowler>(currentInnings.bowlers)
          .map((b) => ({ ...b, isActive: false }))
          .concat(newBowlerObj);
      }

      await update(ref(rtdb), {
        [`matches/${matchId}/cricket/${currentInningsKey}/bowlers`]: updatedBowlers,
        [`matches/${matchId}/meta/updatedAt`]: Date.now(),
      });

      setIsNewBowlerModalOpen(false);
      showToast(`${selectedBowler.name} বোলিং প্রান্তে এসেছেন।`, "success");
    } catch {
      showToast("বোলার পরিবর্তন ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 6️⃣ START SECOND INNINGS
  // ==========================================
  const startSecondInnings = async (strikerId: string, nonStrikerId: string, bowlerId: string) => {
    if (isProcessing || !matchId || !matchData || !cricket) return;

    setIsProcessing(true);
    try {
      const inn1Score = cricket.innings1?.score || 0;
      const target = inn1Score + 1;

      const inn2BattingTeamKey = bowlingTeamKey;
      const inn2BowlingTeamKey = battingTeamKey;

      const inn2BattingSquad = cricket.squads?.[inn2BattingTeamKey] || [];
      const inn2BowlingSquad = cricket.squads?.[inn2BowlingTeamKey] || [];

      const striker = inn2BattingSquad.find((p) => p.id === strikerId);
      const nonStriker = inn2BattingSquad.find((p) => p.id === nonStrikerId);
      const bowler = inn2BowlingSquad.find((p) => p.id === bowlerId);

      if (!striker || !nonStriker || !bowler) {
        showToast("খেলোয়াড় নির্বাচন সঠিক নয়।", "error");
        return;
      }

      const innings2Data = {
        battingTeam: inn2BattingTeamKey,
        score: 0,
        wickets: 0,
        overs: "0.0",
        runRate: 0,
        target,
        extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
        batsmen: [
          { id: striker.id, name: striker.name, runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: true, isOut: false },
          { id: nonStriker.id, name: nonStriker.name, runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: false, isOut: false },
        ],
        bowlers: [{ id: bowler.id, name: bowler.name, overs: "0.0", maidens: 0, runs: 0, wickets: 0, isActive: true }],
        recentBalls: [],
        fallOfWickets: [],
        isCompleted: false,
      };

      await update(ref(rtdb), {
        [`matches/${matchId}/cricket/currentInnings`]: 2,
        [`matches/${matchId}/cricket/innings2`]: innings2Data,
        [`matches/${matchId}/meta/activeGraphic`]: "LOWER_THIRD",
        [`matches/${matchId}/meta/updatedAt`]: Date.now(),
      });

      setIsInningsBreakModalOpen(false);
      showToast("২য় ইনিংস সফলভাবে শুরু হয়েছে!", "success");
    } catch {
      showToast("২য় ইনিংস শুরু করা যায়নি।", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    currentInnings,
    battingTeamKey,
    bowlingTeamKey,
    battingTeamName,
    bowlingTeamName,
    battingSquad,
    bowlingSquad,
    activeBatsmen,
    availableBatsmen,
    activeBowlerObj,
    isProcessing,
    isWicketModalOpen,
    setIsWicketModalOpen,
    isExtrasModalOpen,
    setIsExtrasModalOpen,
    isNewBowlerModalOpen,
    setIsNewBowlerModalOpen,
    isInningsBreakModalOpen,
    setIsInningsBreakModalOpen,
    handleRuns,
    handleSwapStrike,
    confirmWicket,
    confirmExtras,
    confirmNewBowler,
    startSecondInnings,
  };
}