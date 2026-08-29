"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase/client";

interface FootballClockState {
  isRunning?: boolean;
  startedAt?: number | null;
  elapsedSeconds?: number;
}

export function useFootballClock(football: FootballClockState | undefined) {
  const [display, setDisplay] = useState("00:00");
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  // ফায়ারবেস থেকে সার্ভার টাইম অফসেট বের করা
  useEffect(() => {
    const offsetRef = ref(rtdb, ".info/serverTimeOffset");
    const unsub = onValue(offsetRef, (snap) => {
      setServerTimeOffset(snap.val() || 0);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!football) return;

    const compute = () => {
      const base = football.elapsedSeconds || 0;
      const estimatedServerTime = Date.now() + serverTimeOffset;
      
      const live =
        football.isRunning && football.startedAt
          ? base + (estimatedServerTime - football.startedAt) / 1000
          : base;
          
      const secs = Math.max(0, Math.floor(live));
      setTotalSeconds(secs);
      const mm = Math.floor(secs / 60).toString().padStart(2, "0");
      const ss = (secs % 60).toString().padStart(2, "0");
      setDisplay(`${mm}:${ss}`);
    };

    compute();
    if (!football.isRunning) return;
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [football?.isRunning, football?.startedAt, football?.elapsedSeconds, serverTimeOffset]);

  return { display, totalSeconds, minute: Math.floor(totalSeconds / 60) };
}