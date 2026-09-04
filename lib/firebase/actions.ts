// lib/firebase/actions.ts
import { ref, get, update, runTransaction, serverTimestamp } from "firebase/database";
import { rtdb } from "./client";
import { MatchData, CricketState, FootballState } from "../types/match";

interface SnapshotState {
  timestamp: number;
  cricket?: Partial<CricketState>;
  football?: Partial<FootballState>;
  status?: string;
  activeGraphic?: string;
}

// 🛡️ Firebase RTDB ক্র্যাশ প্রতিরোধক: অবজেক্ট বা অ্যারে থেকে সব undefined ফিল্টার করা
function sanitizePayload(obj: any): any {
  if (Array.isArray(obj)) {
    return obj
      .filter((v) => v !== undefined)
      .map(sanitizePayload);
  } else if (obj !== null && typeof obj === "object") {
    if (obj[".sv"] !== undefined) return obj;

    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined) {
        cleaned[key] = sanitizePayload(val);
      }
    }
    return cleaned;
  }
  return obj;
}

export async function commitActionAtomic(
  matchId: string,
  updates: Record<string, any>,
  actionLabel?: string,
  currentState?: MatchData
) {
  if (!matchId) return { success: false, error: "Match ID is required." };

  try {
    let stateToSave: MatchData | null = currentState || null;

    if (!stateToSave) {
      const currentSnap = await get(ref(rtdb, `matches/${matchId}`));
      if (currentSnap.exists()) {
        stateToSave = currentSnap.val() as MatchData;
      }
    }

    if (stateToSave) {
      const snapshot: SnapshotState = {
        timestamp: Date.now(),
        ...(stateToSave.meta?.status ? { status: stateToSave.meta.status } : {}),
        ...(stateToSave.meta?.activeGraphic ? { activeGraphic: stateToSave.meta.activeGraphic } : {}),
      };

      if (stateToSave.cricket) {
        snapshot.cricket = sanitizePayload({
          currentInnings: stateToSave.cricket.currentInnings ?? 1,
          innings1: stateToSave.cricket.innings1 ?? null,
          innings2: stateToSave.cricket.innings2 ?? null,
          maxOvers: stateToSave.cricket.maxOvers ?? 20,
        });
      }

      // 🛡️ Safe defaults: cards বা events undefined থাকলে ফায়ারবেস ট্রানজ্যাকশন ক্র্যাশ করবে না
      if (stateToSave.football) {
        snapshot.football = sanitizePayload({
          scoreA: stateToSave.football.scoreA ?? 0,
          scoreB: stateToSave.football.scoreB ?? 0,
          currentHalf: stateToSave.football.currentHalf ?? 1,
          half1: stateToSave.football.half1 ?? { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } },
          half2: stateToSave.football.half2 ?? { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } },
          cards: stateToSave.football.cards ?? { teamA: [], teamB: [] },
          events: stateToSave.football.events ?? [],
          redCardsA: stateToSave.football.redCardsA ?? 0,
          redCardsB: stateToSave.football.redCardsB ?? 0,
          yellowCardsA: stateToSave.football.yellowCardsA ?? 0,
          yellowCardsB: stateToSave.football.yellowCardsB ?? 0,
        });
      }

      const logRef = ref(rtdb, `match_actionLogs/${matchId}`);
      await runTransaction(logRef, (currentData) => {
        const historyList: SnapshotState[] = Array.isArray(currentData)
          ? [...currentData]
          : currentData
          ? Object.values(currentData)
          : [];

        // 🛡️ সম্পূর্ণ স্যানিটাইজড অবজেক্ট ট্রানজ্যাকশনে রিটার্ন নিশ্চিত করা
        historyList.push(sanitizePayload(snapshot));

        if (historyList.length > 25) {
          historyList.shift();
        }

        return sanitizePayload(historyList);
      });
    }

    const atomicPayload: Record<string, any> = {
      ...updates,
      [`matches/${matchId}/meta/updatedAt`]: serverTimestamp(),
    };

    await update(ref(rtdb), sanitizePayload(atomicPayload));
    return { success: true };
  } catch (error) {
    console.error(`commitActionAtomic Error for match ${matchId}:`, error);
    throw error;
  }
}

export async function undoLastAction(matchId: string) {
  if (!matchId) return { success: false, message: "Match ID is required." };

  try {
    const logRef = ref(rtdb, `match_actionLogs/${matchId}`);
    
    const undoHolder: {
      lastEntry: SnapshotState | null;
      remainingHistory: SnapshotState[];
    } = {
      lastEntry: null,
      remainingHistory: [],
    };

    await runTransaction(logRef, (currentData) => {
      if (!currentData) return currentData;
      const historyList: SnapshotState[] = Array.isArray(currentData)
        ? [...currentData]
        : Object.values(currentData);

      if (historyList.length === 0) return historyList;

      undoHolder.lastEntry = historyList.pop() || null;
      undoHolder.remainingHistory = historyList;
      return sanitizePayload(historyList);
    });

    const lastEntry: SnapshotState | null = undoHolder.lastEntry;

    if (!lastEntry) {
      return { success: false, message: "No actions to undo." };
    }

    const remainingHistory = undoHolder.remainingHistory;

    const rollbackPayload: Record<string, any> = {
      [`match_actionLogs/${matchId}`]: remainingHistory.length > 0 ? remainingHistory : null,
      [`matches/${matchId}/meta/updatedAt`]: serverTimestamp(),
    };

    if (lastEntry.status) {
      rollbackPayload[`matches/${matchId}/meta/status`] = lastEntry.status;
    }
    if (lastEntry.activeGraphic) {
      rollbackPayload[`matches/${matchId}/meta/activeGraphic`] = lastEntry.activeGraphic;
    }

    if (lastEntry.cricket) {
      rollbackPayload[`matches/${matchId}/cricket/innings1`] = lastEntry.cricket.innings1 ?? null;
      rollbackPayload[`matches/${matchId}/cricket/innings2`] = lastEntry.cricket.innings2 ?? null;
      rollbackPayload[`matches/${matchId}/cricket/currentInnings`] = lastEntry.cricket.currentInnings ?? 1;
      if (lastEntry.cricket.maxOvers !== undefined) {
        rollbackPayload[`matches/${matchId}/cricket/maxOvers`] = lastEntry.cricket.maxOvers;
      }
    }

    if (lastEntry.football) {
      rollbackPayload[`matches/${matchId}/football/scoreA`] = lastEntry.football.scoreA ?? 0;
      rollbackPayload[`matches/${matchId}/football/scoreB`] = lastEntry.football.scoreB ?? 0;
      rollbackPayload[`matches/${matchId}/football/currentHalf`] = lastEntry.football.currentHalf ?? 1;
      rollbackPayload[`matches/${matchId}/football/half1`] = lastEntry.football.half1 ?? null;
      rollbackPayload[`matches/${matchId}/football/half2`] = lastEntry.football.half2 ?? null;
      rollbackPayload[`matches/${matchId}/football/cards`] = lastEntry.football.cards ?? { teamA: [], teamB: [] };
      rollbackPayload[`matches/${matchId}/football/events`] = lastEntry.football.events ?? [];
      rollbackPayload[`matches/${matchId}/football/redCardsA`] = lastEntry.football.redCardsA ?? 0;
      rollbackPayload[`matches/${matchId}/football/redCardsB`] = lastEntry.football.redCardsB ?? 0;
      rollbackPayload[`matches/${matchId}/football/yellowCardsA`] = lastEntry.football.yellowCardsA ?? 0;
      rollbackPayload[`matches/${matchId}/football/yellowCardsB`] = lastEntry.football.yellowCardsB ?? 0;
    }

    await update(ref(rtdb), sanitizePayload(rollbackPayload));
    return { success: true };
  } catch (error) {
    console.error(`Failed to execute undoLastAction for match ${matchId}:`, error);
    return { success: false, error };
  }
}