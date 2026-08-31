"use client";

import { useEffect, useState, useRef } from "react";
import { commitActionAtomic } from "@/lib/firebase/actions";
import { useToast } from "@/lib/context/ToastContext";
import type { Batsman, Bowler, FallOfWicket, MatchData, Player } from "@/lib/types/match";

interface InningsData {
  battingTeam?: string;
  score: number;
  wickets: number;
  overs: string;
  runRate?: number;
  target?: number;
  extras?: { wide: number; noBall: number; bye: number; legBye: number };
  batsmen?: Batsman[];
  bowlers?: Bowler[];
  recentBalls?: any[];
  fallOfWickets?: FallOfWicket[];
  isCompleted?: boolean;
}

const addBallToOvers = (currentOvers: string) => {
  let [overs, balls] = (currentOvers || "0.0").split(".").map(Number);
  balls += 1;
  let isEndOfOver = false;
  if (balls >= 6) {
    overs += 1;
    balls = 0;
    isEndOfOver = true;
  }
  return { newOvers: `${overs}.${balls}`, isEndOfOver };
};

const oversToDecimal = (oversStr?: string) => {
  if (!oversStr) return 0;
  const [o, b] = oversStr.split(".").map(Number);
  return (o || 0) + (b || 0) / 6;
};

const isMaidenOver = (recentBalls: any[], currentBallRuns: number) => {
  const currentOverDeliveries = recentBalls.slice(-5);
  const allPreviousDots = currentOverDeliveries.every((b: any) => {
    const label = typeof b === "object" ? b.label : String(b);
    return label === "•" || label === "0" || label === "W";
  });
  return allPreviousDots && currentBallRuns === 0;
};

export function useCricketScoring(matchData: MatchData | null) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isNewBowlerModalOpen, setIsNewBowlerModalOpen] = useState(false);
  const [isInningsBreakModalOpen, setIsInningsBreakModalOpen] = useState(false);

  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const lastCompletedOverBowlerIdRef = useRef<string | null>(null);
  const lastOverNumberRef = useRef<string>("");

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const meta = matchData?.meta;
  const cricket = matchData?.cricket;

  const currentInningsKey = cricket?.currentInnings === 2 ? "innings2" : "innings1";
  const currentInnings: InningsData | undefined = cricket?.[currentInningsKey];

  const battingTeamKey = currentInnings?.battingTeam;
  const bowlingTeamKey = battingTeamKey === "teamA" ? "teamB" : "teamA";
  const battingTeamName = battingTeamKey === "teamA" ? meta?.teamA : meta?.teamB;
  const bowlingTeamName = bowlingTeamKey === "teamA" ? meta?.teamA : meta?.teamB;

  const battingSquad: Player[] = battingTeamKey ? (cricket?.squads?.[battingTeamKey as "teamA" | "teamB"] || []) : [];
  const bowlingSquad: Player[] = bowlingTeamKey ? (cricket?.squads?.[bowlingTeamKey as "teamA" | "teamB"] || []) : [];

  const activeBatsmen: Batsman[] = (currentInnings?.batsmen || []).filter((b: Batsman) => !b.isOut);
  const availableBatsmen: Player[] = battingSquad.filter(
    (p: Player) => !(currentInnings?.batsmen || []).some((b: Batsman) => b.id === p.id)
  );

  const striker = activeBatsmen.find((b: Batsman) => b.onStrike);
  const nonStriker = activeBatsmen.find((b: Batsman) => !b.onStrike);
  const activeBowlerObj: Bowler | undefined = (currentInnings?.bowlers || []).find((bw: Bowler) => bw.isActive);

  useEffect(() => {
    if (meta?.sport === "cricket" && cricket && currentInnings) {
      const currentOvers = currentInnings.overs || "0.0";
      if (
        currentOvers.endsWith(".0") &&
        currentOvers !== "0.0" &&
        lastOverNumberRef.current !== currentOvers &&
        !currentInnings.isCompleted
      ) {
        lastOverNumberRef.current = currentOvers;
        if (activeBowlerObj) {
          lastCompletedOverBowlerIdRef.current = activeBowlerObj.id;
        }
        setIsNewBowlerModalOpen(true);
      }
    }
  }, [matchData, currentInnings, cricket, meta?.sport, activeBowlerObj]);

  const calculateRunRate = (score: number, oversStr: string) => {
    const dec = oversToDecimal(oversStr);
    return dec > 0 ? Number((score / dec).toFixed(2)) : 0;
  };

  const isBowlerChangeRequired = () => {
    if (!currentInnings || !activeBowlerObj) return false;
    const currentOvers = currentInnings.overs || "0.0";

    if (
      currentOvers.endsWith(".0") &&
      currentOvers !== "0.0" &&
      lastCompletedOverBowlerIdRef.current === activeBowlerObj.id
    ) {
      showToast("ওভার শেষ হয়েছে! পরবর্তী বল করার আগে নতুন বোলার নির্বাচন করুন।", "error");
      setIsNewBowlerModalOpen(true);
      return true;
    }
    return false;
  };

  const checkInningsCompletion = (newScore: number, newWickets: number, newOvers: string) => {
    if (!cricket) return false;
    const maxOvers = cricket.maxOvers || 20;
    const totalBatters = battingSquad.length || 11;
    const isAllOut = newWickets >= Math.max(1, totalBatters - 1);
    const isOversDone = Number(newOvers.split(".")[0]) >= maxOvers;

    if (cricket.currentInnings === 1 && !cricket.innings1?.isCompleted) {
      if (isAllOut || isOversDone) {
        const timer = setTimeout(() => setIsInningsBreakModalOpen(true), 1200);
        timeoutRefs.current.push(timer);
        return true;
      }
    } else if (cricket.currentInnings === 2 && !cricket.innings2?.isCompleted) {
      const isTargetReached = currentInnings?.target && newScore >= currentInnings.target;
      if (isTargetReached || isAllOut || isOversDone) {
        const timer = setTimeout(
          () => showToast("Match Completed! You can now finalize and archive the match.", "success"),
          1000
        );
        timeoutRefs.current.push(timer);
        return true;
      }
    }
    return false;
  };

  const handleSwapStrike = async () => {
    if (!currentInnings || isProcessing || activeBatsmen.length < 2 || !striker || !nonStriker) return;
    setIsProcessing(true);

    try {
      const updatedBatsmen = (currentInnings.batsmen || []).map((b: Batsman) => {
        if (b.id === striker.id) return { ...b, onStrike: false };
        if (b.id === nonStriker.id) return { ...b, onStrike: true };
        return b;
      });

      const nextInningsState: InningsData = { ...currentInnings, batsmen: updatedBatsmen };
      const stateUpdates = {
        [`match/cricket/${currentInningsKey}`]: nextInningsState,
        "match/meta/updatedAt": Date.now(),
      };
      const previousPaths = {
        [`match/cricket/${currentInningsKey}`]: currentInnings,
      };

      await commitActionAtomic(stateUpdates, "Swap Strike", previousPaths);
      showToast("Strike swapped!", "info");
    } catch (error) {
      console.error("Strike swap error:", error);
      showToast("Failed to swap strike.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRuns = async (runs: number) => {
    if (!currentInnings || !meta || isProcessing || !striker || !activeBowlerObj) return;
    
    if (isBowlerChangeRequired()) return;

    setIsProcessing(true);

    try {
      const { newOvers, isEndOfOver } = addBallToOvers(currentInnings.overs);
      const newScore = currentInnings.score + runs;
      let rotateStrike = runs % 2 !== 0;
      if (isEndOfOver) rotateStrike = !rotateStrike;

      const updatedBatsmen = (currentInnings.batsmen || []).map((b: Batsman) => {
        if (b.id === striker.id) {
          return {
            ...b,
            runs: b.runs + runs,
            balls: b.balls + 1,
            fours: runs === 4 ? (b.fours || 0) + 1 : b.fours || 0,
            sixes: runs === 6 ? (b.sixes || 0) + 1 : b.sixes || 0,
            onStrike: rotateStrike ? false : true,
          };
        }
        if (nonStriker && b.id === nonStriker.id) {
          return { ...b, onStrike: rotateStrike ? true : false };
        }
        return b;
      });

      const { newOvers: bowlerNewOvers } = addBallToOvers(activeBowlerObj.overs);
      const isMaiden = isEndOfOver && isMaidenOver(currentInnings.recentBalls || [], runs);

      const updatedBowlers = (currentInnings.bowlers || []).map((bw: Bowler) => {
        if (bw.id === activeBowlerObj.id) {
          return {
            ...bw,
            overs: bowlerNewOvers,
            runs: bw.runs + runs,
            maidens: isMaiden ? (bw.maidens || 0) + 1 : bw.maidens || 0,
          };
        }
        return bw;
      });

      const strikerName = striker.name;
      const bowlerName = activeBowlerObj.name;
      const commentaryText =
        runs === 6
          ? `SIX! Massive hit by ${strikerName} over the ropes!`
          : runs === 4
          ? `FOUR! Beautiful shot by ${strikerName} piercing the gap.`
          : runs === 0
          ? `Dot ball. Good line by ${bowlerName}.`
          : `${runs} run${runs > 1 ? "s" : ""} taken by ${strikerName}.`;

      const ballObj = {
        ballNumber: newOvers,
        bowlerName,
        batsmanName: strikerName,
        runs,
        isWicket: false,
        text: commentaryText,
        label: runs === 0 ? "•" : String(runs),
      };

      const isDone = checkInningsCompletion(newScore, currentInnings.wickets, newOvers);

      const nextInningsState: InningsData = {
        ...currentInnings,
        score: newScore,
        overs: newOvers,
        runRate: calculateRunRate(newScore, newOvers),
        batsmen: updatedBatsmen,
        bowlers: updatedBowlers,
        recentBalls: [...(currentInnings.recentBalls || []), ballObj],
        isCompleted: isDone || currentInnings.isCompleted,
      };

      const eventText = runs === 6 ? "SIX" : runs === 4 ? "FOUR" : null;

      const stateUpdates: Record<string, any> = {
        [`match/cricket/${currentInningsKey}`]: nextInningsState,
        "match/meta/updatedAt": Date.now(),
      };
      if (eventText) stateUpdates["match/meta/currentEvent"] = eventText;

      const previousPaths = {
        [`match/cricket/${currentInningsKey}`]: currentInnings,
        "match/meta/currentEvent": meta.currentEvent || null,
      };

      await commitActionAtomic(stateUpdates, `${runs} Runs`, previousPaths);
      if (isMaiden) showToast(`Maiden over for ${activeBowlerObj.name}! 🎯`, "success");
    } catch (error) {
      console.error("Failed to update runs:", error);
      showToast("Error updating score.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmWicket = async ({
    outBatsmanId,
    newBatsmanId,
    dismissalType,
    runsCompleted = 0,
    isWideDelivery = false,
  }: {
    outBatsmanId: string;
    newBatsmanId: string;
    dismissalType: string;
    runsCompleted?: number;
    isWideDelivery?: boolean;
  }) => {
    if (!currentInnings || !meta || isProcessing || !activeBowlerObj || !striker) return;
    
    if (isBowlerChangeRequired()) return;

    setIsProcessing(true);

    try {
      const isLegal = !isWideDelivery;
      const { newOvers, isEndOfOver } = isLegal
        ? addBallToOvers(currentInnings.overs)
        : { newOvers: currentInnings.overs, isEndOfOver: false };

      const totalRunsAdded = runsCompleted + (isWideDelivery ? 1 : 0);
      const newScore = currentInnings.score + totalRunsAdded;
      const newWickets = currentInnings.wickets + 1;
      const outBatsman = (currentInnings.batsmen || []).find((b: Batsman) => b.id === outBatsmanId);
      const nextPlayer = availableBatsmen.find((p: Player) => p.id === newBatsmanId);

      const isStrikerOut = striker.id === outBatsmanId;
      const strikeRotatedByRuns = runsCompleted % 2 !== 0;
      let nextStrikerIsOnStrike = isEndOfOver ? !strikeRotatedByRuns : strikeRotatedByRuns;

      const updatedBatsmen: Batsman[] = (currentInnings.batsmen || []).map((b: Batsman) => {
        if (b.id === outBatsmanId) {
          return {
            ...b,
            runs: isStrikerOut ? b.runs + runsCompleted : b.runs,
            balls: isLegal && isStrikerOut ? b.balls + 1 : b.balls,
            isOut: true,
            dismissal: dismissalType,
            onStrike: false,
          };
        }
        if (isStrikerOut && nonStriker && b.id === nonStriker.id) {
          return { ...b, onStrike: nextStrikerIsOnStrike };
        }
        if (!isStrikerOut && b.id === striker.id) {
          return {
            ...b,
            runs: b.runs + runsCompleted,
            balls: isLegal ? b.balls + 1 : b.balls,
            onStrike: nextStrikerIsOnStrike ? false : true,
          };
        }
        return b;
      });

      if (nextPlayer) {
        updatedBatsmen.push({
          id: nextPlayer.id,
          name: nextPlayer.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          onStrike: isStrikerOut ? (nextStrikerIsOnStrike ? false : true) : nextStrikerIsOnStrike ? true : false,
          isOut: false,
        });
      }

      const { newOvers: bowlerNewOvers } = isLegal
        ? addBallToOvers(activeBowlerObj.overs)
        : { newOvers: activeBowlerObj.overs };

      const isBowlerWicket = !["Run Out", "Hit Wicket", "Timed Out", "Obstructing Field"].includes(dismissalType);
      const isMaiden = isEndOfOver && isLegal && isMaidenOver(currentInnings.recentBalls || [], totalRunsAdded);

      const updatedBowlers = (currentInnings.bowlers || []).map((bw: Bowler) => {
        if (bw.id === activeBowlerObj.id) {
          return {
            ...bw,
            overs: bowlerNewOvers,
            runs: bw.runs + totalRunsAdded,
            wickets: isBowlerWicket ? bw.wickets + 1 : bw.wickets,
            maidens: isMaiden ? (bw.maidens || 0) + 1 : bw.maidens || 0,
          };
        }
        return bw;
      });

      const currentExtras = currentInnings.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0 };
      const updatedExtras = {
        ...currentExtras,
        wide: isWideDelivery ? currentExtras.wide + 1 + runsCompleted : currentExtras.wide,
      };

      const newFow: FallOfWicket = {
        score: newScore,
        wicketNumber: newWickets,
        overs: newOvers,
        batsmanName: outBatsman?.name || "Batter",
      };

      const ballLabel = isWideDelivery ? (runsCompleted > 0 ? `Wd+W+${runsCompleted}` : "Wd+W") : (runsCompleted > 0 ? `W+${runsCompleted}` : "W");
      const ballObj = {
        ballNumber: newOvers,
        bowlerName: activeBowlerObj.name,
        batsmanName: outBatsman?.name || "Batter",
        runs: totalRunsAdded,
        isWicket: true,
        text: `OUT! ${outBatsman?.name} departs (${dismissalType})${runsCompleted > 0 ? ` after completing ${runsCompleted} run(s)` : ""}.`,
        label: ballLabel,
      };

      const isDone = checkInningsCompletion(newScore, newWickets, newOvers);

      const nextInningsState: InningsData = {
        ...currentInnings,
        score: newScore,
        wickets: newWickets,
        overs: newOvers,
        runRate: calculateRunRate(newScore, newOvers),
        extras: updatedExtras,
        batsmen: updatedBatsmen,
        bowlers: updatedBowlers,
        recentBalls: [...(currentInnings.recentBalls || []), ballObj],
        fallOfWickets: [...(currentInnings.fallOfWickets || []), newFow],
        isCompleted: isDone || currentInnings.isCompleted,
      };

      const stateUpdates: Record<string, any> = {
        [`match/cricket/${currentInningsKey}`]: nextInningsState,
        "match/meta/currentEvent": "WICKET",
        "match/meta/updatedAt": Date.now(),
      };

      const previousPaths = {
        [`match/cricket/${currentInningsKey}`]: currentInnings,
        "match/meta/currentEvent": meta.currentEvent || null,
      };

      await commitActionAtomic(stateUpdates, "Wicket", previousPaths);
      setIsWicketModalOpen(false);
      if (isMaiden) showToast(`Maiden over for ${activeBowlerObj.name}! 🎯`, "success");
    } catch (error) {
      console.error("Failed to commit wicket:", error);
      showToast("Error processing wicket.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmExtras = async ({
    type,
    extraRunsRan,
    isFromBat,
  }: {
    type: string;
    extraRunsRan: number;
    isFromBat?: boolean;
  }) => {
    if (!currentInnings || !meta || isProcessing || !striker || !activeBowlerObj) return;

    if (isBowlerChangeRequired()) return;

    setIsProcessing(true);

    try {
      let isLegalDelivery = false;
      let penalty = 0;
      let ballLabel = "Ex";

      if (type === "Wide") {
        penalty = 1 + extraRunsRan;
        ballLabel = extraRunsRan > 0 ? `Wd+${extraRunsRan}` : "Wd";
      } else if (type === "No Ball") {
        penalty = 1 + extraRunsRan;
        ballLabel = extraRunsRan > 0 ? `Nb+${extraRunsRan}` : "Nb";
      } else if (type === "Bye") {
        isLegalDelivery = true;
        penalty = extraRunsRan || 1;
        ballLabel = extraRunsRan > 1 ? `${extraRunsRan}b` : "b";
      } else if (type === "Leg Bye") {
        isLegalDelivery = true;
        penalty = extraRunsRan || 1;
        ballLabel = extraRunsRan > 1 ? `${extraRunsRan}lb` : "lb";
      }

      const { newOvers, isEndOfOver } = isLegalDelivery
        ? addBallToOvers(currentInnings.overs)
        : { newOvers: currentInnings.overs, isEndOfOver: false };

      const rotateStrike = (extraRunsRan % 2 !== 0 && !isEndOfOver) || (extraRunsRan % 2 === 0 && isEndOfOver);

      const updatedBatsmen = (currentInnings.batsmen || []).map((b: Batsman) => {
        if (b.id === striker.id) {
          const addedRuns = type === "No Ball" && isFromBat ? extraRunsRan : 0;
          return {
            ...b,
            runs: b.runs + addedRuns,
            balls: isLegalDelivery || (type === "No Ball" && isFromBat) ? b.balls + 1 : b.balls,
            fours: addedRuns === 4 ? (b.fours || 0) + 1 : b.fours || 0,
            sixes: addedRuns === 6 ? (b.sixes || 0) + 1 : b.sixes || 0,
            onStrike: rotateStrike ? false : true,
          };
        }
        if (nonStriker && b.id === nonStriker.id) {
          return { ...b, onStrike: rotateStrike ? true : false };
        }
        return b;
      });

      const { newOvers: bowlerNewOvers } = isLegalDelivery
        ? addBallToOvers(activeBowlerObj.overs)
        : { newOvers: activeBowlerObj.overs };

      const bowlerConceded = ["Wide", "No Ball"].includes(type) ? penalty : 0;
      const updatedBowlers = (currentInnings.bowlers || []).map((bw: Bowler) => {
        if (bw.id === activeBowlerObj.id) {
          return {
            ...bw,
            overs: bowlerNewOvers,
            runs: bw.runs + bowlerConceded,
          };
        }
        return bw;
      });

      const currentExtras = currentInnings.extras || { wide: 0, noBall: 0, bye: 0, legBye: 0 };
      const updatedExtras = {
        ...currentExtras,
        wide: type === "Wide" ? currentExtras.wide + penalty : currentExtras.wide,
        noBall: type === "No Ball" ? currentExtras.noBall + 1 : currentExtras.noBall,
        bye: type === "Bye" ? currentExtras.bye + penalty : currentExtras.bye,
        legBye: type === "Leg Bye" ? currentExtras.legBye + penalty : currentExtras.legBye,
      };

      const newScore = currentInnings.score + penalty;

      const ballObj = {
        ballNumber: isLegalDelivery ? newOvers : currentInnings.overs,
        bowlerName: activeBowlerObj.name,
        batsmanName: striker.name,
        runs: penalty,
        isWicket: false,
        text: `Extra conceded: ${type} (+${penalty} runs).`,
        label: ballLabel,
      };

      const isDone = checkInningsCompletion(newScore, currentInnings.wickets, newOvers);

      const nextInningsState: InningsData = {
        ...currentInnings,
        score: newScore,
        overs: newOvers,
        runRate: calculateRunRate(newScore, newOvers),
        extras: updatedExtras,
        batsmen: updatedBatsmen,
        bowlers: updatedBowlers,
        recentBalls: [...(currentInnings.recentBalls || []), ballObj],
        isCompleted: isDone || currentInnings.isCompleted,
      };

      const stateUpdates = {
        [`match/cricket/${currentInningsKey}`]: nextInningsState,
        "match/meta/updatedAt": Date.now(),
      };

      const previousPaths = {
        [`match/cricket/${currentInningsKey}`]: currentInnings,
      };

      await commitActionAtomic(stateUpdates, `Extra: ${type}`, previousPaths);
      setIsExtrasModalOpen(false);
    } catch (error) {
      console.error("Failed to commit extras:", error);
      showToast("Error recording extras.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmNewBowler = async (bowlerId: string) => {
    if (!currentInnings || isProcessing) return;
    setIsProcessing(true);

    try {
      let updatedBowlers = (currentInnings.bowlers || []).map((bw: Bowler) => ({
        ...bw,
        isActive: bw.id === bowlerId,
      }));

      const exists = updatedBowlers.some((bw: Bowler) => bw.id === bowlerId);
      if (!exists) {
        const playerObj = bowlingSquad.find((p: Player) => p.id === bowlerId);
        if (playerObj) {
          updatedBowlers.push({
            id: playerObj.id,
            name: playerObj.name,
            overs: "0.0",
            maidens: 0,
            runs: 0,
            wickets: 0,
            isActive: true,
          });
        }
      }

      lastCompletedOverBowlerIdRef.current = null;

      const nextInningsState: InningsData = {
        ...currentInnings,
        bowlers: updatedBowlers,
      };

      const stateUpdates = {
        [`match/cricket/${currentInningsKey}`]: nextInningsState,
        "match/meta/updatedAt": Date.now(),
      };

      const previousPaths = {
        [`match/cricket/${currentInningsKey}`]: currentInnings,
      };

      await commitActionAtomic(stateUpdates, "New Bowler", previousPaths);
      setIsNewBowlerModalOpen(false);
    } catch (error) {
      console.error("Failed to change bowler:", error);
      showToast("Error updating bowler.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const startSecondInnings = async (strikerId: string, nonStrikerId: string, bowlerId: string) => {
    if (!cricket || isProcessing) return;
    setIsProcessing(true);

    try {
      const inn1 = cricket.innings1;
      const targetScore = (inn1?.score || 0) + 1;

      const chasingTeamKey = inn1?.battingTeam === "teamA" ? "teamB" : "teamA";
      const defendingTeamKey = inn1?.battingTeam === "teamA" ? "teamA" : "teamB";

      const chasingSquad: Player[] = cricket.squads?.[chasingTeamKey] || [];
      const defendingSquad: Player[] = cricket.squads?.[defendingTeamKey] || [];

      const strikerPlayer = chasingSquad.find((p: Player) => p.id === strikerId);
      const nonStrikerPlayer = chasingSquad.find((p: Player) => p.id === nonStrikerId);
      const bowlerPlayer = defendingSquad.find((p: Player) => p.id === bowlerId);

      lastCompletedOverBowlerIdRef.current = null;
      lastOverNumberRef.current = "";

      const nextInnings2: InningsData = {
        battingTeam: chasingTeamKey,
        score: 0,
        wickets: 0,
        overs: "0.0",
        runRate: 0,
        target: targetScore,
        extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
        batsmen: [
          {
            id: strikerPlayer?.id || strikerId,
            name: strikerPlayer?.name || "Striker",
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            onStrike: true,
            isOut: false,
          },
          {
            id: nonStrikerPlayer?.id || nonStrikerId,
            name: nonStrikerPlayer?.name || "Non-Striker",
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            onStrike: false,
            isOut: false,
          },
        ],
        bowlers: [
          {
            id: bowlerPlayer?.id || bowlerId,
            name: bowlerPlayer?.name || "Bowler",
            overs: "0.0",
            maidens: 0,
            runs: 0,
            wickets: 0,
            isActive: true,
          },
        ],
        recentBalls: [],
        fallOfWickets: [],
        isCompleted: false,
      };

      const stateUpdates = {
        "match/cricket/currentInnings": 2,
        "match/cricket/innings1/isCompleted": true,
        "match/cricket/innings2": nextInnings2,
        "match/meta/activeGraphic": "LOWER_THIRD",
        "match/meta/updatedAt": Date.now(),
      };

      const previousPaths = {
        "match/cricket": cricket,
      };

      await commitActionAtomic(stateUpdates, "Start 2nd Innings", previousPaths);
      setIsInningsBreakModalOpen(false);
      showToast("2nd Innings Started!", "success");
    } catch (error) {
      console.error("Failed to start 2nd innings:", error);
      showToast("Error starting 2nd innings.", "error");
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