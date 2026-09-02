// lib/firebase/actions.ts
import { ref, get, set, update } from "firebase/database";
import { rtdb } from "./client";

export async function commitActionAtomic(
  matchId: string,
  updates: Record<string, any>,
  actionLabel?: string,
  currentState?: any
) {
  if (!matchId) return { success: false, error: "Match ID is required." };

  try {
    let stateToSave = currentState || null;

    if (!stateToSave) {
      const currentSnap = await get(ref(rtdb, `matches/${matchId}`));
      if (currentSnap.exists()) {
        stateToSave = currentSnap.val();
      }
    }

    // ১. মেমরি-লাইট স্ন্যাপশট হিস্ট্রি সেভ (ডুপ্লিকেট stringify বাদ)
    if (stateToSave) {
      const logRef = ref(rtdb, `match_actionLogs/${matchId}`);
      const snap = await get(logRef);
      const history = snap.exists() ? snap.val() : [];
      const historyList = Array.isArray(history) ? [...history] : Object.values(history);

      historyList.push({
        state: stateToSave,
        timestamp: Date.now(),
      });

      // মেমোরি ও ডাটাবেস স্টোরেজ বাঁচাতে সর্বোচ্চ ১৫টি রোলব্যাক লেভেল যথেষ্ট
      if (historyList.length > 15) {
        historyList.shift();
      }

      await set(logRef, historyList);
    }

    // ২. অ্যাটমিক আপডেট
    await update(ref(rtdb), {
      ...updates,
      [`matches/${matchId}/meta/updatedAt`]: Date.now(),
    });

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
    if (!logData) return { success: false, message: "No actions to undo." };

    let historyList = Array.isArray(logData) ? [...logData] : Object.values(logData);
    if (historyList.length === 0) return { success: false, message: "No actions to undo." };

    const lastEntry: any = historyList.pop();
    const restoredState = lastEntry?.state || (typeof lastEntry?.previousState === "string" ? JSON.parse(lastEntry.previousState) : null);

    if (!restoredState) {
      await set(logRef, historyList.length > 0 ? historyList : null);
      return { success: false, message: "Corrupted undo state removed." };
    }

    await set(ref(rtdb, `matches/${matchId}`), restoredState);
    await set(logRef, historyList.length > 0 ? historyList : null);

    return { success: true };
  } catch (error) {
    console.error(`Failed to execute undoLastAction for match ${matchId}:`, error);
    return { success: false, error };
  }
}