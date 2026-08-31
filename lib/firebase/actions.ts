import { ref, update, push, get, query, orderByKey, limitToLast } from "firebase/database";
import { rtdb } from "./client";

const ACTION_LOG_PATH = "match_actionLog";
const MAX_ACTION_LOG_ENTRIES = 25;

/**
 * Atomic Commit: ডেটা আপডেট এবং ActionLog পুশ একই ট্রানজ্যাকশনে সম্পন্ন করে
 */
export const commitActionAtomic = async (
  stateUpdates: Record<string, any>,
  actionType: string,
  previousPaths: Record<string, any>
) => {
  const newLogKey = push(ref(rtdb, ACTION_LOG_PATH)).key;

  const updates: Record<string, any> = {
    ...stateUpdates,
    [`${ACTION_LOG_PATH}/${newLogKey}`]: {
      timestamp: Date.now(),
      type: actionType,
      previousState: JSON.stringify(previousPaths),
    },
  };

  const result = await update(ref(rtdb), updates);

  try {
    await pruneActionLog();
  } catch (err) {
    console.warn("actionLog prune skipped:", err);
  }

  return result;
};

const pruneActionLog = async () => {
  const logQuery = query(ref(rtdb, ACTION_LOG_PATH), orderByKey());
  const snapshot = await get(logQuery);
  if (!snapshot.exists()) return;

  const entries = Object.keys(snapshot.val());
  if (entries.length > MAX_ACTION_LOG_ENTRIES) {
    const toDelete = entries.slice(0, entries.length - MAX_ACTION_LOG_ENTRIES);
    const deleteUpdates: Record<string, null> = {};
    toDelete.forEach((key) => {
      deleteUpdates[`${ACTION_LOG_PATH}/${key}`] = null;
    });
    await update(ref(rtdb), deleteUpdates);
  }
};

/**
 * Undo Engine: সর্বশেষ লগ থেকে সম্পূর্ণ স্ন্যাপশট নিখুঁতভাবে রিস্টোর করে
 */
export const undoLastAction = async () => {
  const logQuery = query(ref(rtdb, ACTION_LOG_PATH), orderByKey(), limitToLast(1));
  const snapshot = await get(logQuery);

  if (!snapshot.exists()) return null;

  const logEntry = snapshot.val();
  const logKey = Object.keys(logEntry)[0];
  const previousState = JSON.parse(logEntry[logKey].previousState);

  const updates: Record<string, any> = {};

  for (const [path, val] of Object.entries(previousState)) {
    updates[path] = val === undefined ? null : val;
  }
  updates[`${ACTION_LOG_PATH}/${logKey}`] = null;

  return update(ref(rtdb), updates);
};