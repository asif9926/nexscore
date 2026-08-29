"use client";

import { useEffect, useState, useRef } from "react";
import { increment } from "firebase/database";
import { commitActionAtomic } from "@/lib/firebase/actions";
import { useToast } from "@/lib/context/ToastContext";
import type { Batsman, Bowler, MatchData } from "@/lib/types/match";

const addBallToOvers = (currentOvers: string) => {
  let [overs, balls] = currentOvers.split(".").map(Number);
  balls += 1;
  let isEndOfOver = false;
  if (balls === 6) {
    overs += 1;
    balls = 0;
    isEndOfOver = true;
  }
  return { newOvers: `${overs}.${balls}`, isEndOfOver };
};

interface ConfirmWicketArgs {
  outBatsmanId: string;
  newBatsmanId: string;
  dismissalType: string;
}

interface ConfirmExtrasArgs {
  type: string;
  extraRunsRan: number;
  isFromBat?: boolean;
}

export function useCricketScoring(matchData: MatchData | null) {
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWicketModalOpen, setIsWicketModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isNewBowlerModalOpen, setIsNewBowlerModalOpen] = useState(false);
  const [isInningsBreakModalOpen, setIsInningsBreakModalOpen] = useState(false);

  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const meta = matchData?.meta;
  const cricket = matchData?.cricket;

  const currentInningsKey = cricket?.currentInnings === 2 ? "innings2" : "innings1";
  const currentInnings = cricket?.[currentInningsKey];

  const battingTeamKey = currentInnings?.battingTeam;
  const bowlingTeamKey = battingTeamKey === "teamA" ? "teamB" : "teamA";
  const battingTeamName = battingTeamKey === "teamA" ? meta?.teamA : meta?.teamB;
  const bowlingTeamName = bowlingTeamKey === "teamA" ? meta?.teamA : meta?.teamB;

  const battingSquad = battingTeamKey ? cricket?.squads?.[battingTeamKey as "teamA" | "teamB"] || [] : [];
  const bowlingSquad = bowlingTeamKey ? cricket?.squads?.[bowlingTeamKey as "teamA" | "teamB"] || [] : [];

  const activeBatsmen: Batsman[] = currentInnings?.batsmen?.filter((b) => !b.isOut) || [];
  const availableBatsmen = battingSquad.filter(
    (p) => !currentInnings?.batsmen?.find((b) => b.id === p.id)
  );

  const strikerId = activeBatsmen.find((b) => b.onStrike)?.id;
  const nonStrikerId = activeBatsmen.find((b) => !b.onStrike)?.id;
  const activeBowlerId = currentInnings?.bowlers?.find((b) => b.isActive)?.id;
  const activeBowlerObj: Bowler | undefined = currentInnings?.bowlers?.find((b) => b.isActive);

  const lastPromptedOverRef = useRef<string>("");

useEffect(() => {
  if (meta?.sport === "cricket" && cricket) {
    const innings = cricket[currentInningsKey];
    const currentOvers = innings?.overs || "0.0";

    if (
      currentOvers.endsWith(".0") &&
      currentOvers !== "0.0" &&
      lastPromptedOverRef.current !== currentOvers
    ) {
      lastPromptedOverRef.current = currentOvers;
      setIsNewBowlerModalOpen(true);
    }
  }
}, [matchData, currentInningsKey, cricket, meta?.sport]);

  const checkInningsCompletion = (newScore: number, newWickets: number, newOvers: string) => {
    if (!cricket) return;
    const isAllOut = newWickets >= 10;
    const isOversDone = Number(newOvers.split(".")[0]) >= (cricket.maxOvers || 20);

    if (cricket.currentInnings === 1 && !cricket.innings1.isCompleted) {
      if (isAllOut || isOversDone) {
        const timer = setTimeout(() => setIsInningsBreakModalOpen(true), 1500);
        timeoutRefs.current.push(timer);
      }
    } else if (cricket.currentInnings === 2 && !cricket.innings2.isCompleted) {
      const isTargetReached = currentInnings?.target && newScore >= currentInnings.target;
      if (isTargetReached || isAllOut || isOversDone) {
        const timer = setTimeout(
          () => showToast("Match Completed! Target Reached or Innings Over. You can now End Match & Archive.", "success"),
          1000
        );
        timeoutRefs.current.push(timer);
      }
    }
  };

  const handleRuns = async (runs: number) => {
    if (!currentInnings || !meta || isProcessing) return;
    setIsProcessing(true);

    try {
      const { newOvers, isEndOfOver } = addBallToOvers(currentInnings.overs);

      let rotateStrike = runs % 2 !== 0;
      if (isEndOfOver) rotateStrike = !rotateStrike;

      const strikerName = currentInnings.batsmen.find((b) => b.id === strikerId)?.name || "Batter";
      const bowlerName = currentInnings.bowlers.find((b) => b.id === activeBowlerId)?.name || "Bowler";

      const commentaryText =
        runs === 6
          ? `SIX! Massive hit by ${strikerName} over the ropes!`
          : runs === 4
          ? `FOUR! Beautiful shot by ${strikerName} to the boundary.`
          : runs === 0
          ? `Dot ball. Good bowling by ${bowlerName}.`
          : `${runs} run${runs > 1 ? "s" : ""} taken by ${strikerName}.`;

      const newBallObj = {
        ballNumber: newOvers,
        runs: runs,
        isWicket: false,
        isExtra: false,
        batsmanName: strikerName,
        bowlerName: bowlerName,
        text: commentaryText,
        timestamp: Date.now(),
        label: String(runs),
      };

      const updatedRecentBalls = [...(currentInnings.recentBalls || []).slice(-29), newBallObj];

      const strikerIndex = currentInnings.batsmen.findIndex((b) => b.id === strikerId);
      const nonStrikerIndex = currentInnings.batsmen.findIndex((b) => b.id === nonStrikerId);
      const bowlerIndex = currentInnings.bowlers.findIndex((b) => b.id === activeBowlerId);

      const stateUpdates: Record<string, any> = {
        [`match/cricket/${currentInningsKey}/score`]: increment(runs),
        [`match/cricket/${currentInningsKey}/overs`]: newOvers,
        [`match/cricket/${currentInningsKey}/recentBalls`]: updatedRecentBalls,
        ...(meta.activeGraphic && meta.activeGraphic !== "LOWER_THIRD"
          ? { "match/meta/activeGraphic": "LOWER_THIRD" }
          : {}),
        ...(runs === 4 || runs === 6 ? { "match/meta/currentEvent": runs === 4 ? "FOUR" : "SIX" } : {}),
      };

      const previousPaths: Record<string, any> = {
        [`match/cricket/${currentInningsKey}/score`]: currentInnings.score,
        [`match/cricket/${currentInningsKey}/overs`]: currentInnings.overs,
        [`match/cricket/${currentInningsKey}/recentBalls`]: currentInnings.recentBalls || [],
        ...(meta.activeGraphic && meta.activeGraphic !== "LOWER_THIRD"
          ? { "match/meta/activeGraphic": meta.activeGraphic }
          : {}),
        "match/meta/currentEvent": meta.currentEvent,
      };

      if (strikerIndex !== -1) {
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/runs`] = increment(runs);
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/balls`] = increment(1);
        if (runs === 4) stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/fours`] = increment(1);
        if (runs === 6) stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/sixes`] = increment(1);
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/onStrike`] = !rotateStrike;

        previousPaths[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}`] = currentInnings.batsmen[strikerIndex];
      }

      if (nonStrikerIndex !== -1) {
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${nonStrikerIndex}/onStrike`] = rotateStrike;
        previousPaths[`match/cricket/${currentInningsKey}/batsmen/${nonStrikerIndex}`] = currentInnings.batsmen[nonStrikerIndex];
      }

      if (bowlerIndex !== -1) {
        const currentBowler = currentInnings.bowlers[bowlerIndex];
        const { newOvers: bowlerOvers, isEndOfOver: bowlerOverDone } = addBallToOvers(currentBowler.overs);

        stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}/runs`] = increment(runs);
        stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}/overs`] = bowlerOvers;

        if (bowlerOverDone) {
          const currentOverBalls = (currentInnings.recentBalls || []).slice(-5);
          const runsInThisOver =
            currentOverBalls.reduce(
              (acc: number, b: any) => acc + (typeof b === "object" ? b.runs : Number(b) || 0),
              0
            ) + runs;
          if (runsInThisOver === 0) {
            stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}/maidens`] = increment(1);
          }
        }

        previousPaths[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}`] = currentBowler;
      }

      await commitActionAtomic(stateUpdates, `${runs} Runs`, previousPaths);
      checkInningsCompletion(currentInnings.score + runs, currentInnings.wickets, newOvers);

      if (runs === 4 || runs === 6) {
        const timer = setTimeout(
          () =>
            commitActionAtomic({ "match/meta/currentEvent": null }, "Clear Event", {
              "match/meta/currentEvent": runs === 4 ? "FOUR" : "SIX",
            }),
          4000
        );
        timeoutRefs.current.push(timer);
      }
    } catch (error) {
      console.error("Error adding runs:", error);
      showToast("Failed to update runs. Check connection.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmWicket = async ({ outBatsmanId, newBatsmanId, dismissalType }: ConfirmWicketArgs) => {
    if (!currentInnings || !meta || isProcessing) return;
    setIsProcessing(true);
    setIsWicketModalOpen(false);

    try {
      const isAllOut = (currentInnings.wickets + 1) >= 10 || availableBatsmen.length === 0;
      const newPlayerInfo = isAllOut ? null : battingSquad.find((p) => p.id === newBatsmanId);

      if (!isAllOut && !newPlayerInfo) {
        showToast("Invalid new batsman", "error");
        setIsProcessing(false);
        return;
      }

      const { newOvers, isEndOfOver } = addBallToOvers(currentInnings.overs);
      const outBatsmanIndex = currentInnings.batsmen.findIndex((b) => b.id === outBatsmanId);
      const newBatsmanIndex = currentInnings.batsmen.length;
      const bowlerIndex = currentInnings.bowlers.findIndex((b) => b.id === activeBowlerId);

      const outBatsmanInfo = currentInnings.batsmen[outBatsmanIndex];
      const newBatsmanOnStrike = isEndOfOver ? !outBatsmanInfo?.onStrike : outBatsmanInfo?.onStrike ?? false;
      const outBatsmanName = outBatsmanInfo?.name || "Unknown";
      const bowlerName = currentInnings.bowlers[bowlerIndex]?.name || "Bowler";

      const newBallObj = {
        ballNumber: newOvers,
        runs: 0,
        isWicket: true,
        wicketType: dismissalType,
        isExtra: false,
        batsmanName: outBatsmanName,
        bowlerName: bowlerName,
        text: `WICKET! ${outBatsmanName} is OUT (${dismissalType})!`,
        timestamp: Date.now(),
        label: "W",
      };

      const updatedRecentBallsW = [...(currentInnings.recentBalls || []).slice(-29), newBallObj];
      const updatedFallOfWickets = [
        ...(currentInnings.fallOfWickets || []),
        {
          wicketNumber: currentInnings.wickets + 1,
          score: currentInnings.score,
          overs: currentInnings.overs,
          batsmanName: outBatsmanName,
        },
      ];

      const stateUpdates: Record<string, any> = {
        [`match/cricket/${currentInningsKey}/wickets`]: increment(1),
        [`match/cricket/${currentInningsKey}/overs`]: newOvers,
        [`match/cricket/${currentInningsKey}/fallOfWickets`]: updatedFallOfWickets,
        [`match/cricket/${currentInningsKey}/recentBalls`]: updatedRecentBallsW,
        ...(meta.activeGraphic && meta.activeGraphic !== "LOWER_THIRD"
          ? { "match/meta/activeGraphic": "LOWER_THIRD" }
          : {}),
        "match/meta/currentEvent": "WICKET",
      };

      const previousPaths: Record<string, any> = {
        [`match/cricket/${currentInningsKey}/wickets`]: currentInnings.wickets,
        [`match/cricket/${currentInningsKey}/overs`]: currentInnings.overs,
        [`match/cricket/${currentInningsKey}/fallOfWickets`]: currentInnings.fallOfWickets || [],
        [`match/cricket/${currentInningsKey}/recentBalls`]: currentInnings.recentBalls || [],
        ...(meta.activeGraphic && meta.activeGraphic !== "LOWER_THIRD"
          ? { "match/meta/activeGraphic": meta.activeGraphic }
          : {}),
        "match/meta/currentEvent": meta.currentEvent,
      };

      if (outBatsmanIndex !== -1) {
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${outBatsmanIndex}/isOut`] = true;
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${outBatsmanIndex}/dismissal`] = dismissalType;
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${outBatsmanIndex}/balls`] = increment(1);
        previousPaths[`match/cricket/${currentInningsKey}/batsmen/${outBatsmanIndex}`] = currentInnings.batsmen[outBatsmanIndex];
      }

      if (!isAllOut && newPlayerInfo) {
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${newBatsmanIndex}`] = {
          id: newPlayerInfo.id,
          name: newPlayerInfo.name,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          onStrike: newBatsmanOnStrike,
          isOut: false,
        };
        previousPaths[`match/cricket/${currentInningsKey}/batsmen/${newBatsmanIndex}`] = null;
      }

      const otherBatsmanId = outBatsmanId === strikerId ? nonStrikerId : strikerId;
      const otherBatsmanIndex = currentInnings.batsmen.findIndex((b) => b.id === otherBatsmanId);
      if (otherBatsmanIndex !== -1) {
        const otherBatsmanInfo = currentInnings.batsmen[otherBatsmanIndex];
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${otherBatsmanIndex}/onStrike`] = isEndOfOver
          ? !otherBatsmanInfo.onStrike
          : otherBatsmanInfo.onStrike;
        previousPaths[`match/cricket/${currentInningsKey}/batsmen/${otherBatsmanIndex}`] = otherBatsmanInfo;
      }

      if (bowlerIndex !== -1) {
        const isBowlerWicket = dismissalType !== "Run Out";
        const { newOvers: bowlerOvers } = addBallToOvers(currentInnings.bowlers[bowlerIndex].overs);

        stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}/overs`] = bowlerOvers;
        if (isBowlerWicket) {
          stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}/wickets`] = increment(1);
        }
        previousPaths[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}`] = currentInnings.bowlers[bowlerIndex];
      }

      await commitActionAtomic(stateUpdates, `Wicket: ${dismissalType}`, previousPaths);
      checkInningsCompletion(currentInnings.score, currentInnings.wickets + 1, newOvers);

      const timer = setTimeout(
        () =>
          commitActionAtomic({ "match/meta/currentEvent": null }, "Clear Event", {
            "match/meta/currentEvent": "WICKET",
          }),
        4000
      );
      timeoutRefs.current.push(timer);
    } catch (error) {
      console.error("Error confirming wicket:", error);
      showToast("Failed to process wicket.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmExtras = async ({ type, extraRunsRan, isFromBat }: ConfirmExtrasArgs) => {
    if (!currentInnings || !meta || isProcessing) return;
    setIsProcessing(true);
    setIsExtrasModalOpen(false);

    try {
      let penaltyRuns = 0;
      let totalRunsToAdd = extraRunsRan;
      let newOvers = currentInnings.overs;
      let isEndOfOver = false;
      let extraFieldKey: "wide" | "noBall" | "bye" | "legBye";

      if (type === "Wide") {
        penaltyRuns = 1;
        totalRunsToAdd += 1;
        extraFieldKey = "wide";
      } else if (type === "No Ball") {
        penaltyRuns = 1;
        totalRunsToAdd += 1;
        extraFieldKey = "noBall";
      } else if (type === "Bye") {
        extraFieldKey = "bye";
        const res = addBallToOvers(currentInnings.overs);
        newOvers = res.newOvers;
        isEndOfOver = res.isEndOfOver;
      } else {
        extraFieldKey = "legBye";
        const res = addBallToOvers(currentInnings.overs);
        newOvers = res.newOvers;
        isEndOfOver = res.isEndOfOver;
      }

      let rotateStrike = extraRunsRan % 2 !== 0;
      if (isEndOfOver) rotateStrike = !rotateStrike;

      const ballLabel =
        type === "Wide"
          ? `Wd${extraRunsRan > 0 ? "+" + extraRunsRan : ""}`
          : type === "No Ball"
          ? `Nb${extraRunsRan > 0 ? "+" + extraRunsRan : ""}`
          : type === "Bye"
          ? `${extraRunsRan}b`
          : `${extraRunsRan}lb`;

      const strikerName = currentInnings.batsmen.find((b) => b.id === strikerId)?.name || "Batter";
      const bowlerName = currentInnings.bowlers.find((b) => b.id === activeBowlerId)?.name || "Bowler";

      const commentaryText =
        isFromBat && type === "No Ball"
          ? `No Ball! And ${strikerName} scores ${extraRunsRan} run(s) off the bat!`
          : `Extra (${type}): ${totalRunsToAdd} run${totalRunsToAdd > 1 ? "s" : ""} added.`;

      const newBallObj = {
        ballNumber: newOvers,
        runs: totalRunsToAdd,
        isWicket: false,
        isExtra: true,
        extraType: type,
        batsmanName: strikerName,
        bowlerName: bowlerName,
        text: commentaryText,
        timestamp: Date.now(),
        label: ballLabel,
      };

      const updatedRecentBallsExtra = [...(currentInnings.recentBalls || []).slice(-29), newBallObj];

      const strikerIndex = currentInnings.batsmen.findIndex((b) => b.id === strikerId);
      const nonStrikerIndex = currentInnings.batsmen.findIndex((b) => b.id === nonStrikerId);
      const bowlerIndex = currentInnings.bowlers.findIndex((b) => b.id === activeBowlerId);

      const extrasCountToAdd = isFromBat && type === "No Ball" ? penaltyRuns : totalRunsToAdd;

      const stateUpdates: Record<string, any> = {
        [`match/cricket/${currentInningsKey}/score`]: increment(totalRunsToAdd),
        [`match/cricket/${currentInningsKey}/overs`]: newOvers,
        [`match/cricket/${currentInningsKey}/extras/${extraFieldKey}`]: increment(extrasCountToAdd),
        [`match/cricket/${currentInningsKey}/recentBalls`]: updatedRecentBallsExtra,
        ...(meta.activeGraphic && meta.activeGraphic !== "LOWER_THIRD"
          ? { "match/meta/activeGraphic": "LOWER_THIRD" }
          : {}),
        ...(isFromBat && (extraRunsRan === 4 || extraRunsRan === 6)
          ? { "match/meta/currentEvent": extraRunsRan === 4 ? "FOUR" : "SIX" }
          : {}),
      };

      const previousPaths: Record<string, any> = {
        [`match/cricket/${currentInningsKey}/score`]: currentInnings.score,
        [`match/cricket/${currentInningsKey}/overs`]: currentInnings.overs,
        [`match/cricket/${currentInningsKey}/extras/${extraFieldKey}`]: currentInnings.extras[extraFieldKey],
        [`match/cricket/${currentInningsKey}/recentBalls`]: currentInnings.recentBalls || [],
        ...(meta.activeGraphic && meta.activeGraphic !== "LOWER_THIRD"
          ? { "match/meta/activeGraphic": meta.activeGraphic }
          : {}),
        "match/meta/currentEvent": meta.currentEvent,
      };

      if (strikerIndex !== -1) {
        const addBall = type !== "Wide" ? 1 : 0;
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/balls`] = increment(addBall);
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/onStrike`] = !rotateStrike;

        if (isFromBat && type === "No Ball" && extraRunsRan > 0) {
          stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/runs`] = increment(extraRunsRan);
          if (extraRunsRan === 4) stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/fours`] = increment(1);
          if (extraRunsRan === 6) stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}/sixes`] = increment(1);
        }

        previousPaths[`match/cricket/${currentInningsKey}/batsmen/${strikerIndex}`] = currentInnings.batsmen[strikerIndex];
      }

      if (nonStrikerIndex !== -1) {
        stateUpdates[`match/cricket/${currentInningsKey}/batsmen/${nonStrikerIndex}/onStrike`] = rotateStrike;
        previousPaths[`match/cricket/${currentInningsKey}/batsmen/${nonStrikerIndex}`] = currentInnings.batsmen[nonStrikerIndex];
      }

      if (bowlerIndex !== -1) {
        const bowlerRunsToAdd = type === "Wide" || type === "No Ball" ? totalRunsToAdd : 0;
        const { newOvers: bowlerOvers } =
          type !== "Wide" && type !== "No Ball"
            ? addBallToOvers(currentInnings.bowlers[bowlerIndex].overs)
            : { newOvers: currentInnings.bowlers[bowlerIndex].overs };

        if (bowlerRunsToAdd > 0) {
          stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}/runs`] = increment(bowlerRunsToAdd);
        }
        stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}/overs`] = bowlerOvers;

        previousPaths[`match/cricket/${currentInningsKey}/bowlers/${bowlerIndex}`] = currentInnings.bowlers[bowlerIndex];
      }

      await commitActionAtomic(stateUpdates, `Extra: ${type} + ${extraRunsRan}`, previousPaths);
      checkInningsCompletion(currentInnings.score + totalRunsToAdd, currentInnings.wickets, newOvers);
    } catch (error) {
      console.error("Error adding extras:", error);
      showToast("Failed to process extras.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmNewBowler = async (bowlerId: string) => {
    if (!currentInnings) return;
    setIsProcessing(true);

    try {
      const playerInfo = bowlingSquad.find((p) => p.id === bowlerId);
      if (!playerInfo) {
        showToast("Invalid bowler selected", "error");
        setIsProcessing(false);
        return;
      }

      const currentActiveIndex = currentInnings.bowlers.findIndex((b) => b.isActive);
      const existingBowlerIndex = currentInnings.bowlers.findIndex((b) => b.id === bowlerId);

      const stateUpdates: Record<string, any> = {};
      const previousPaths: Record<string, any> = {};

      if (currentActiveIndex !== -1) {
        stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${currentActiveIndex}/isActive`] = false;
        previousPaths[`match/cricket/${currentInningsKey}/bowlers/${currentActiveIndex}`] = currentInnings.bowlers[currentActiveIndex];
      }

      if (existingBowlerIndex !== -1) {
        stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${existingBowlerIndex}/isActive`] = true;
        previousPaths[`match/cricket/${currentInningsKey}/bowlers/${existingBowlerIndex}`] = currentInnings.bowlers[existingBowlerIndex];
      } else {
        const newBowlerIndex = currentInnings.bowlers.length;
        stateUpdates[`match/cricket/${currentInningsKey}/bowlers/${newBowlerIndex}`] = {
          id: playerInfo.id,
          name: playerInfo.name,
          overs: "0.0",
          maidens: 0,
          runs: 0,
          wickets: 0,
          isActive: true,
        };
        previousPaths[`match/cricket/${currentInningsKey}/bowlers/${newBowlerIndex}`] = null;
      }

      await commitActionAtomic(stateUpdates, "Change Bowler", previousPaths);
      setIsNewBowlerModalOpen(false);
    } catch (error) {
      console.error("Error changing bowler:", error);
      showToast("Failed to change bowler.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const startSecondInnings = async (newStrikerId: string, newNonStrikerId: string, newBowlerId: string) => {
    if (!currentInnings || !cricket) return;
    setIsProcessing(true);

    try {
      const chasingTeamKey = bowlingTeamKey;
      const defendingTeamKey = battingTeamKey;

      const chasingSquad = cricket.squads[chasingTeamKey as "teamA" | "teamB"] || [];
      const defendingSquad = cricket.squads[defendingTeamKey as "teamA" | "teamB"] || [];

      const striker = chasingSquad.find((p) => p.id === newStrikerId);
      const nonStriker = chasingSquad.find((p) => p.id === newNonStrikerId);
      const bowler = defendingSquad.find((p) => p.id === newBowlerId);

      if (!striker || !nonStriker || !bowler) {
        showToast("Invalid starting players", "error");
        setIsProcessing(false);
        return;
      }

      const targetScore = currentInnings.score + 1;

      const innings2Data = {
        battingTeam: chasingTeamKey,
        score: 0,
        wickets: 0,
        overs: "0.0",
        runRate: 0,
        extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
        target: targetScore,
        isCompleted: false,
        batsmen: [
          { id: striker.id, name: striker.name, runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: true, isOut: false },
          { id: nonStriker.id, name: nonStriker.name, runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: false, isOut: false },
        ],
        bowlers: [{ id: bowler.id, name: bowler.name, overs: "0.0", maidens: 0, runs: 0, wickets: 0, isActive: true }],
        recentBalls: [],
        fallOfWickets: [],
      };

      await commitActionAtomic(
        {
          "match/cricket/innings1/isCompleted": true,
          "match/cricket/currentInnings": 2,
          "match/cricket/innings2": innings2Data,
        },
        "Start 2nd Innings",
        {
          "match/cricket/innings1/isCompleted": false,
          "match/cricket/currentInnings": 1,
          "match/cricket/innings2": cricket.innings2 || null,
        }
      );

      setIsInningsBreakModalOpen(false);
      showToast("Second Innings Started!", "success");
    } catch (error) {
      console.error("Error starting second innings:", error);
      showToast("Failed to start second innings.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    isWicketModalOpen,
    setIsWicketModalOpen,
    isExtrasModalOpen,
    setIsExtrasModalOpen,
    isNewBowlerModalOpen,
    setIsNewBowlerModalOpen,
    isInningsBreakModalOpen,
    setIsInningsBreakModalOpen,
    currentInnings,
    battingTeamName,
    bowlingTeamName,
    battingTeamKey,
    bowlingTeamKey,
    battingSquad,
    activeBatsmen,
    availableBatsmen,
    strikerId,
    nonStrikerId,
    activeBowlerObj,
    bowlingSquad,
    handleRuns,
    confirmWicket,
    confirmExtras,
    confirmNewBowler,
    startSecondInnings,
  };
}