// lib/firebase/actions.ts
import { ref, get, update } from "firebase/database";
import { rtdb } from "./client";
import { MatchData, CricketState, FootballState } from "../types/match";

interface SnapshotState {
  timestamp: number;
  cricket?: Partial<CricketState>;
  football?: Partial<FootballState>;
}

// 🛡️ Firebase RTDB ক্র্যাশ প্রতিরোধক: অবজেক্ট থেকে সব undefined ফিল্টার করা
function sanitizePayload(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  } else if (obj !== null && typeof obj === "object") {
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

    const logRef = ref(rtdb, `match_actionLogs/${matchId}`);
    const snap = await get(logRef);
    const history = snap.exists() ? snap.val() : [];
    const historyList: SnapshotState[] = Array.isArray(history) 
      ? [...history] 
      : Object.values(history);

    if (stateToSave) {
      const snapshot: SnapshotState = {
        timestamp: Date.now(),
      };

      if (stateToSave.cricket) {
        snapshot.cricket = {
          currentInnings: stateToSave.cricket.currentInnings,
          innings1: stateToSave.cricket.innings1,
          innings2: stateToSave.cricket.innings2,
        };
      }

      if (stateToSave.football) {
        snapshot.football = {
          scoreA: stateToSave.football.scoreA,
          scoreB: stateToSave.football.scoreB,
          currentHalf: stateToSave.football.currentHalf,
          half1: stateToSave.football.half1,
          half2: stateToSave.football.half2,
          cards: stateToSave.football.cards,
          events: stateToSave.football.events,
        };
      }

      historyList.push(snapshot);

      if (historyList.length > 15) {
        historyList.shift();
      }
    }

    const atomicPayload: Record<string, any> = {
      ...updates,
      [`matches/${matchId}/meta/updatedAt`]: Date.now(),
      [`match_actionLogs/${matchId}`]: historyList,
    };

    // সম্পূর্ণ স্যানিটাইজড পেলোড ফায়ারবেসে রাইট
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
    const snapshot = await get(logRef);

    if (!snapshot.exists()) return { success: false, message: "No actions to undo." };

    const logData = snapshot.val();
    const historyList: SnapshotState[] = Array.isArray(logData) 
      ? [...logData] 
      : Object.values(logData);

    if (historyList.length === 0) return { success: false, message: "No actions to undo." };

    const lastEntry = historyList.pop();
    if (!lastEntry) {
      return { success: false, message: "Corrupted undo state removed." };
    }

    const rollbackPayload: Record<string, any> = {
      [`match_actionLogs/${matchId}`]: historyList.length > 0 ? historyList : null,
      [`matches/${matchId}/meta/updatedAt`]: Date.now(),
    };

    if (lastEntry.cricket) {
      rollbackPayload[`matches/${matchId}/cricket/innings1`] = lastEntry.cricket.innings1;
      rollbackPayload[`matches/${matchId}/cricket/innings2`] = lastEntry.cricket.innings2;
      rollbackPayload[`matches/${matchId}/cricket/currentInnings`] = lastEntry.cricket.currentInnings;
    }

    if (lastEntry.football) {
      rollbackPayload[`matches/${matchId}/football/scoreA`] = lastEntry.football.scoreA;
      rollbackPayload[`matches/${matchId}/football/scoreB`] = lastEntry.football.scoreB;
      rollbackPayload[`matches/${matchId}/football/currentHalf`] = lastEntry.football.currentHalf;
      rollbackPayload[`matches/${matchId}/football/half1`] = lastEntry.football.half1;
      rollbackPayload[`matches/${matchId}/football/half2`] = lastEntry.football.half2;
      rollbackPayload[`matches/${matchId}/football/cards`] = lastEntry.football.cards;
      rollbackPayload[`matches/${matchId}/football/events`] = lastEntry.football.events;
    }

    await update(ref(rtdb), sanitizePayload(rollbackPayload));
    return { success: true };
  } catch (error) {
    console.error(`Failed to execute undoLastAction for match ${matchId}:`, error);
    return { success: false, error };
  }
}