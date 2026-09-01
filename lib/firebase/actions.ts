// lib/firebase/actions.ts
import { ref, get, set, update, remove } from "firebase/database";
import { rtdb } from "./client";

/**
 * ⚡ ATOMIC ACTION COMMITTOR
 * ম্যাচ আপডেটের পূর্বে স্বয়ংক্রিয়ভাবে স্ন্যাপশট হিস্ট্রিতে সেভ করে এবং এটমিক আপডেট চালায়।
 */
export async function commitActionAtomic(
  updates: Record<string, any>,
  currentStateOrLabel?: any,
  maybeState?: any
) {
  try {
    let stateToSave: any = null;

    // পাস করা স্টেট চেক (২য় বা ৩য় আর্গুমেন্ট থেকে)
    if (typeof currentStateOrLabel === "object" && currentStateOrLabel !== null) {
      stateToSave = currentStateOrLabel;
    } else if (typeof maybeState === "object" && maybeState !== null) {
      stateToSave = maybeState;
    } else {
      // যদি স্টেট পাস না করা থাকে, RTDB থেকে কারেন্ট স্টেট ফেচ করবে
      const currentSnap = await get(ref(rtdb, "match"));
      if (currentSnap.exists()) {
        stateToSave = currentSnap.val();
      }
    }

    // ১. পূর্বাবস্থা হিস্ট্রি লগে যুক্ত করা
    if (stateToSave) {
      const logRef = ref(rtdb, "match_actionLog");
      const snap = await get(logRef);
      const history = snap.exists() ? snap.val() : [];
      const historyList = Array.isArray(history) ? [...history] : Object.values(history);

      historyList.push({
        state: stateToSave,
        previousState: JSON.stringify(stateToSave), // ব্যাকওয়ার্ড কমপ্যাটিবিলিটির জন্য
        timestamp: Date.now(),
      });

      // সর্বোচ্চ ২৫টি অ্যাকশন সংরক্ষণ করবে
      if (historyList.length > 25) {
        historyList.shift();
      }

      await set(logRef, historyList);
    }

    // ২. রিয়েলটাইম ডেটাবেসে এটমিক আপডেট কার্যকর করা
    await update(ref(rtdb), {
      ...updates,
      "match/meta/updatedAt": Date.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("commitActionAtomic Error:", error);
    throw error;
  }
}

/**
 * 🔄 ATOMIC UNDO ENGINE
 * ম্যাচ লগের সর্বশেষ স্ন্যাপশট পুনরুদ্ধার করে এবং রিয়েলটাইম ডেটাবেসে আগের অবস্থায় রোলব্যাক করে।
 */
export async function undoLastAction() {
  try {
    const logRef = ref(rtdb, "match_actionLog");
    const snapshot = await get(logRef);

    if (!snapshot.exists()) {
      return { success: false, message: "No actions to undo." };
    }

    const logData = snapshot.val();
    if (!logData) return { success: false, message: "No actions to undo." };

    let historyList: any[] = [];
    const isArray = Array.isArray(logData);

    if (isArray) {
      historyList = [...logData];
    } else if (typeof logData === "object") {
      const keys = Object.keys(logData);
      historyList = keys.map((key) => ({ _key: key, ...logData[key] }));
    }

    if (historyList.length === 0) {
      return { success: false, message: "No actions to undo." };
    }

    // সর্বশেষ স্ন্যাপশটটি নেওয়া
    const lastEntry = historyList.pop();
    if (!lastEntry) {
      return { success: false, message: "No actions to undo." };
    }

    // 🛡️ সেইফ স্টেট এক্সট্রাকশন (State / PreviousState উভয়েই কাজ করবে)
    let rawState = lastEntry.state ?? lastEntry.previousState ?? lastEntry;
    let restoredState: any = null;

    if (typeof rawState === "string") {
      try {
        restoredState = JSON.parse(rawState);
      } catch {
        restoredState = null;
      }
    } else if (typeof rawState === "object" && rawState !== null) {
      restoredState = rawState;
    }

    if (!restoredState) {
      console.warn("Corrupted undo entry skipped:", lastEntry);
      if (isArray) {
        await set(logRef, historyList.length > 0 ? historyList : null);
      } else if (lastEntry._key) {
        await remove(ref(rtdb, `match_actionLog/${lastEntry._key}`));
      }
      return { success: false, message: "Corrupted undo state removed." };
    }

    if (restoredState._key) {
      delete restoredState._key;
    }

    // ১. পূর্বের অবস্থায় ম্যাচ ডেটা রি-স্টোর করা
    await set(ref(rtdb, "match"), restoredState);

    // ২. হিস্ট্রি স্ট্যাক থেকে বাদ দেওয়া
    if (isArray) {
      await set(logRef, historyList.length > 0 ? historyList : null);
    } else if (lastEntry._key) {
      await remove(ref(rtdb, `match_actionLog/${lastEntry._key}`));
    } else {
      await set(logRef, historyList.length > 0 ? historyList : null);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to execute undoLastAction:", error);
    return { success: false, error };
  }
}