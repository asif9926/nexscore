// lib/hooks/useCricketScoring.ts
"use client";

import { useState } from "react";
import { commitActionAtomic } from "@/lib/firebase/actions";
import { useToast } from "@/lib/context/ToastContext";
import type { MatchData, Batsman, Bowler, FallOfWicket, BallCommentary } from "@/lib/types/match";
import { safeArray, getMaxWickets } from "@/lib/utils";
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

// নিখুঁত মেইডেন ওভার বের করার ফাংশন (কেবলমাত্র বর্তমান ওভারের বলের ভিত্তিতে)
const isOverMaiden = (
  recentDeliveries: BallCommentary[],
  completedOverNumber: number,
  bowlerName: string
): boolean => {
  const overBalls = recentDeliveries.filter((ball) => {
    const ballOverNum = Math.floor(oversToTotalBalls(ball.ballNumber) / 6);
    return ball.bowlerName === bowlerName && ballOverNum === completedOverNumber;
  });

  if (overBalls.length < 6) return false;
  const totalRunsConceded = overBalls.reduce((sum, b) => sum + (b.runs || 0), 0);
  return totalRunsConceded === 0;
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
  const activeBowlerObj =
    bowlersList.find((b) => b.isActive) ||
    (currentInnings?.overs === "0.0" && bowlersList.length > 0 ? bowlersList[0] : undefined);

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
      showToast("উভয় প্রান্তে ব্যাটসম্যান থাকা আবশ্যক।", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const newScore = (currentInnings.score || 0) + runs;
      const newOvers = addBallToOvers(currentInnings.overs || "0.0");
      const isOverComplete = newOvers.endsWith(".0");
      const bowlerNewOvers = addBallToOvers(activeBowlerObj.overs || "0.0");
      const completedOverIndex = Math.floor(oversToTotalBalls(newOvers) / 6);

      // ব্যাটসম্যানদের পরিসংখ্যান ও স্ট্রাইক রোটেশন
      const updatedBatsmen = safeArray<Batsman>(currentInnings.batsmen).map((b) => {
        if (b.id === striker.id) {
          const stayOnStrike = isOverComplete ? runs % 2 !== 0 : runs % 2 === 0;
          return {
            ...b,
            runs: (b.runs || 0) + runs,
            balls: (b.balls || 0) + 1,
            fours: runs === 4 ? (b.fours || 0) + 1 : b.fours || 0,
            sixes: runs === 6 ? (b.sixes || 0) + 1 : b.sixes || 0,
            onStrike: stayOnStrike,
          };
        }
        if (b.id === nonStriker.id) {
          const stayOnStrike = isOverComplete ? runs % 2 === 0 : runs % 2 !== 0;
          return {
            ...b,
            onStrike: stayOnStrike,
          };
        }
        return b;
      });

      const ballLog: BallCommentary = {
        ballNumber: newOvers,
        runs,
        label: String(runs),
        batsmanName: striker.name,
        bowlerName: activeBowlerObj.name,
        isWicket: false,
        isExtra: false,
        text: generateRunCommentary({
          bowlerName: activeBowlerObj.name,
          batsmanName: striker.name,
          runs,
        }),
        timestamp: Date.now(),
      };

      const updatedRecentBalls = [...safeArray<BallCommentary>(currentInnings.recentBalls), ballLog];
      const isMaiden = isOverComplete && isOverMaiden(updatedRecentBalls, completedOverIndex, activeBowlerObj.name);

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
      };

      if (eventText) updates[`matches/${matchId}/meta/currentEvent`] = eventText;

      const maxOvers = cricket?.maxOvers || 20;
      const target = currentInnings.target;

      if (currentInningsNum === 2 && target && newScore >= target) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/isCompleted`] = true;
        updates[`matches/${matchId}/meta/status`] = "completed";
        updates[`matches/${matchId}/meta/activeGraphic`] = "RESULT_POSTER";
      } else if (oversToTotalBalls(newOvers) >= maxOvers * 6) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/isCompleted`] = true;
        if (currentInningsNum === 1) {
          setIsInningsBreakModalOpen(true);
        } else {
          updates[`matches/${matchId}/meta/status`] = "completed";
          updates[`matches/${matchId}/meta/activeGraphic`] = "RESULT_POSTER";
        }
      }

      await commitActionAtomic(matchId, updates, `Runs: ${runs}`, matchData);

      if (isOverComplete && oversToTotalBalls(newOvers) < maxOvers * 6 && !(currentInningsNum === 2 && target && newScore >= target)) {
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
      const updatedBatsmen = safeArray<Batsman>(currentInnings.batsmen).map((b) => {
        if (!b.isOut) return { ...b, onStrike: !b.onStrike };
        return b;
      });

      const updates = {
        [`matches/${matchId}/cricket/${currentInningsKey}/batsmen`]: updatedBatsmen,
      };

      await commitActionAtomic(matchId, updates, "Swap Strike", matchData);
      showToast("স্ট্রাইক অদলবদল করা হয়েছে।", "info");
    } catch {
      showToast("স্ট্রাইক পরিবর্তন ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 3️⃣ WICKET ENGINE (STRIKE RESOLVER FIXED)
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
      const runsCompleted = data.runsCompleted || 0;
      const isLegalDelivery = !data.isWideDelivery;
      const extraPenalty = data.isWideDelivery ? 1 : 0;

      const newScore = (currentInnings.score || 0) + runsCompleted + extraPenalty;
      const newWickets = (currentInnings.wickets || 0) + 1;
      const newOvers = isLegalDelivery ? addBallToOvers(currentInnings.overs || "0.0") : currentInnings.overs || "0.0";
      const isOverComplete = isLegalDelivery && newOvers.endsWith(".0");
      const bowlerNewOvers = isLegalDelivery ? addBallToOvers(activeBowlerObj.overs || "0.0") : activeBowlerObj.overs || "0.0";

      const outBatsman = safeArray<Batsman>(currentInnings.batsmen).find((b) => b.id === data.outBatsmanId);
      const isStrikerOut = !!outBatsman?.onStrike;

      // 🛡️ ফিক্সড আন্তর্জাতিক ক্রিকেট স্ট্রাইক রেজোলভার
      let survivingBatsmanStrike = false;
      let newBatsmanStrike = false;

      if (isStrikerOut) {
        // নতুন ব্যাটসম্যান স্ট্রাইকে আসবে (যদি না ওভার শেষ হয়)
        if (isOverComplete) {
          survivingBatsmanStrike = true;
          newBatsmanStrike = false;
        } else {
          survivingBatsmanStrike = false;
          newBatsmanStrike = true;
        }
      } else {
        // নন-স্ট্রাইকার রান আউট হলে স্ট্রাইকার স্ট্রাইকে থাকবে
        const oddRuns = runsCompleted % 2 !== 0;
        if (isOverComplete) {
          survivingBatsmanStrike = oddRuns;
          newBatsmanStrike = !oddRuns;
        } else {
          survivingBatsmanStrike = !oddRuns;
          newBatsmanStrike = oddRuns;
        }
      }

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
        if (!b.isOut) {
          return { ...b, onStrike: survivingBatsmanStrike };
        }
        return b;
      });

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
            onStrike: newBatsmanStrike,
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

      const fowEntry: FallOfWicket = {
        score: newScore,
        wicketNumber: newWickets,
        overs: newOvers,
        batsmanName: outBatsman?.name || "Batsman",
      };
      const updatedFOW = [...safeArray(currentInnings.fallOfWickets), fowEntry];

      const ballLog: BallCommentary = {
        ballNumber: newOvers,
        runs: runsCompleted,
        label: "W",
        batsmanName: outBatsman?.name || "Batsman",
        bowlerName: activeBowlerObj.name,
        isWicket: true,
        wicketType: data.dismissalType,
        isExtra: !!data.isWideDelivery,
        extraType: data.isWideDelivery ? "Wide" : undefined,
        text: generateWicketCommentary({
          bowlerName: activeBowlerObj.name,
          batsmanName: outBatsman?.name || "Batsman",
          dismissalType: data.dismissalType,
          runsCompleted,
        }),
        timestamp: Date.now(),
      };
      const updatedRecentBalls = [...safeArray<BallCommentary>(currentInnings.recentBalls), ballLog];

      const completedOverIndex = Math.floor(oversToTotalBalls(newOvers) / 6);
      const isMaiden = isOverComplete && isLegalDelivery && isOverMaiden(updatedRecentBalls, completedOverIndex, activeBowlerObj.name);

      const updatedBowlers = safeArray<Bowler>(currentInnings.bowlers).map((b) => {
        if (b.id === activeBowlerObj.id) {
          return {
            ...b,
            wickets: isBowlerWicket ? (b.wickets || 0) + 1 : b.wickets || 0,
            runs: (b.runs || 0) + runsCompleted + extraPenalty,
            overs: bowlerNewOvers,
            maidens: isMaiden ? (b.maidens || 0) + 1 : b.maidens || 0,
            isActive: !isOverComplete,
          };
        }
        return b;
      });

      const maxWickets = getMaxWickets(battingSquad.length);
      const isAllOut = newWickets >= maxWickets;
      const target = currentInnings.target;
      const isTargetReached = currentInningsNum === 2 && target && newScore >= target;

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
      };

      if (data.isWideDelivery) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/extras/wide`] =
          (currentInnings.extras?.wide || 0) + 1;
      }

      if (isAllOut || isTargetReached) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/isCompleted`] = true;
        if (currentInningsNum === 1 && isAllOut) {
          setIsInningsBreakModalOpen(true);
        } else {
          updates[`matches/${matchId}/meta/status`] = "completed";
          updates[`matches/${matchId}/meta/activeGraphic`] = "RESULT_POSTER";
        }
      }

      await commitActionAtomic(matchId, updates, `Wicket: ${outBatsman?.name}`, matchData);
      setIsWicketModalOpen(false);

      if (isOverComplete && !isAllOut && !isTargetReached) {
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
  // 4️⃣ EXTRAS ENGINE (BYE & LEG-BYE ACCURACY)
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
      const bowlerNewOvers = isLegal ? addBallToOvers(activeBowlerObj.overs || "0.0") : activeBowlerObj.overs || "0.0";

      // ব্যাটসম্যানদের পরিসংখ্যান ও স্ট্রাইক
      const updatedBatsmen = safeArray<Batsman>(currentInnings.batsmen).map((b) => {
        if (b.id === striker?.id) {
          const batRuns = isNoBall && data.isFromBat ? (b.runs || 0) + data.extraRunsRan : b.runs || 0;
          const ballFaced = isLegal || (isNoBall && data.isFromBat) ? (b.balls || 0) + 1 : b.balls || 0;
          const newFours = isNoBall && data.isFromBat && data.extraRunsRan === 4 ? (b.fours || 0) + 1 : b.fours || 0;
          const newSixes = isNoBall && data.isFromBat && data.extraRunsRan === 6 ? (b.sixes || 0) + 1 : b.sixes || 0;

          let strikeState = b.onStrike;
          if (data.extraRunsRan % 2 !== 0) strikeState = !strikeState;
          if (isOverComplete) strikeState = !strikeState;

          return { ...b, runs: batRuns, balls: ballFaced, fours: newFours, sixes: newSixes, onStrike: strikeState };
        }
        if (b.id === nonStriker?.id) {
          let strikeState = b.onStrike;
          if (data.extraRunsRan % 2 !== 0) strikeState = !strikeState;
          if (isOverComplete) strikeState = !strikeState;
          return { ...b, onStrike: strikeState };
        }
        return b;
      });

      // বোলারের রান কনসিডেড (বাই/লেগ বাই বোলারের অ্যাকাউন্টে যাবে না)
      let bowlerRunsAdded = 0;
      if (isWide) {
        bowlerRunsAdded = totalRunsFromBall;
      } else if (isNoBall) {
        bowlerRunsAdded = data.isFromBat ? 1 + data.extraRunsRan : 1;
      }

      const label = `${data.extraRunsRan > 0 ? data.extraRunsRan : ""}${
        data.type === "Wide" ? "Wd" : data.type === "No Ball" ? "Nb" : data.type === "Leg Bye" ? "lb" : "b"
      }`;

      const ballLog: BallCommentary = {
        ballNumber: newOvers,
        runs: totalRunsFromBall,
        label,
        batsmanName: striker?.name || "Striker",
        bowlerName: activeBowlerObj.name,
        isWicket: false,
        isExtra: true,
        extraType: data.type,
        text: generateExtraCommentary({
          bowlerName: activeBowlerObj.name,
          batsmanName: striker?.name || "Striker",
          type: data.type,
          totalRuns: totalRunsFromBall,
        }),
        timestamp: Date.now(),
      };
      const updatedRecentBalls = [...safeArray<BallCommentary>(currentInnings.recentBalls), ballLog];

      const completedOverIndex = Math.floor(oversToTotalBalls(newOvers) / 6);
      const isMaiden = isOverComplete && isLegal && isOverMaiden(updatedRecentBalls, completedOverIndex, activeBowlerObj.name);

      const updatedBowlers = safeArray<Bowler>(currentInnings.bowlers).map((b) => {
        if (b.id === activeBowlerObj.id) {
          return {
            ...b,
            runs: (b.runs || 0) + bowlerRunsAdded,
            overs: bowlerNewOvers,
            maidens: isMaiden ? (b.maidens || 0) + 1 : b.maidens || 0,
            isActive: !isOverComplete,
          };
        }
        return b;
      });

      const currentExtras = currentInnings.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0 };
      const updatedExtras = { ...currentExtras };
      if (isWide) updatedExtras.wide = (updatedExtras.wide || 0) + totalRunsFromBall;
      if (isNoBall) updatedExtras.noBall = (updatedExtras.noBall || 0) + 1;
      if (data.type === "Bye") updatedExtras.bye = (updatedExtras.bye || 0) + data.extraRunsRan;
      if (data.type === "Leg Bye") updatedExtras.legBye = (updatedExtras.legBye || 0) + data.extraRunsRan;

      const maxOvers = cricket?.maxOvers || 20;
      const target = currentInnings.target;
      const isTargetReached = currentInningsNum === 2 && target && newScore >= target;
      const isOversFinished = oversToTotalBalls(newOvers) >= maxOvers * 6;

      const updates: Record<string, any> = {
        [`matches/${matchId}/cricket/${currentInningsKey}/score`]: newScore,
        [`matches/${matchId}/cricket/${currentInningsKey}/overs`]: newOvers,
        [`matches/${matchId}/cricket/${currentInningsKey}/runRate`]: calculateRunRate(newScore, newOvers),
        [`matches/${matchId}/cricket/${currentInningsKey}/extras`]: updatedExtras,
        [`matches/${matchId}/cricket/${currentInningsKey}/batsmen`]: updatedBatsmen,
        [`matches/${matchId}/cricket/${currentInningsKey}/bowlers`]: updatedBowlers,
        [`matches/${matchId}/cricket/${currentInningsKey}/recentBalls`]: updatedRecentBalls,
      };

      if (isTargetReached) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/isCompleted`] = true;
        updates[`matches/${matchId}/meta/status`] = "completed";
        updates[`matches/${matchId}/meta/activeGraphic`] = "RESULT_POSTER";
      } else if (isOversFinished) {
        updates[`matches/${matchId}/cricket/${currentInningsKey}/isCompleted`] = true;
        if (currentInningsNum === 1) {
          setIsInningsBreakModalOpen(true);
        } else {
          updates[`matches/${matchId}/meta/status`] = "completed";
          updates[`matches/${matchId}/meta/activeGraphic`] = "RESULT_POSTER";
        }
      }

      await commitActionAtomic(matchId, updates, `Extra: ${label}`, matchData);
      setIsExtrasModalOpen(false);

      if (isOverComplete && !isTargetReached && !isOversFinished) {
        setIsNewBowlerModalOpen(true);
      }
    } catch (err) {
      console.error("Extras error:", err);
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

    // একই বোলার টানা দুই ওভার বল করতে পারবে না
    if (activeBowlerObj && activeBowlerObj.id === bowlerId && currentInnings.overs !== "0.0") {
      showToast("একই বোলার পরপর দুই ওভার বল করতে পারবেন না।", "error");
      return;
    }

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

      const updates = {
        [`matches/${matchId}/cricket/${currentInningsKey}/bowlers`]: updatedBowlers,
      };

      await commitActionAtomic(matchId, updates, `New Bowler: ${selectedBowler.name}`, matchData);
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

      const updates = {
        [`matches/${matchId}/cricket/currentInnings`]: 2,
        [`matches/${matchId}/cricket/innings2`]: innings2Data,
        [`matches/${matchId}/meta/activeGraphic`]: "LOWER_THIRD",
      };

      await commitActionAtomic(matchId, updates, "Start 2nd Innings", matchData);
      setIsInningsBreakModalOpen(false);
      showToast("২য় ইনিংস শুরু হয়েছে!", "success");
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