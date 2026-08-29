// lib/firebase/actions.ts
import { ref, update, push, get, query, orderByKey, limitToLast } from "firebase/database";
import { rtdb } from "./client";

const ACTION_LOG_PATH = "match_actionLog";

// এক ম্যাচে ঘরে কতগুলো undo-log entry রাখা হবে তার cap — অ্যাডমিনের রিড payload
// আর ডাটাবেজ সাইজ দুটোকেই বাউন্ডেড রাখে।
const MAX_ACTION_LOG_ENTRIES = 20;

/**
 * Atomic Update: ডেটা আপডেট এবং ActionLog পুশ একসাথেই হবে
 */
export const commitActionAtomic = async (
  stateUpdates: Record<string, any>,
  actionType: string,
  previousPaths: Record<string, any>
) => {
  const newLogKey = push(ref(rtdb, ACTION_LOG_PATH)).key;

  const updates = {
    ...stateUpdates,
    [`${ACTION_LOG_PATH}/${newLogKey}`]: {
      timestamp: Date.now(),
      type: actionType,
      previousState: JSON.stringify(previousPaths),
    },
  };

  const result = await update(ref(rtdb), updates);

  // Unhandled Promise ফিক্স করার জন্য try-catch এবং await ব্যবহার করা হলো
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
 * Undo Logic: সবশেষ লগ থেকে আগের স্টেট রিস্টোর করা
 */
export const undoLastAction = async () => {
  const logQuery = query(ref(rtdb, ACTION_LOG_PATH), orderByKey(), limitToLast(1));
  const snapshot = await get(logQuery);

  if (!snapshot.exists()) return null;

  const logEntry = snapshot.val();
  const logKey = Object.keys(logEntry)[0];

  // স্ট্রিং থেকে পার্স করে আবার অবজেক্টে (পাথগুলোতে) রূপান্তর করে নিচ্ছি
  const previousState = JSON.parse(logEntry[logKey].previousState);

  const updates = {
    ...previousState,
    [`${ACTION_LOG_PATH}/${logKey}`]: null,
  };

  return update(ref(rtdb), updates);
};