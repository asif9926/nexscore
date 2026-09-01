// lib/hooks/useMatchData.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";
import { MatchData } from "@/lib/types/match";

export function useMatchData(matchId?: string) {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }

    const matchRef = ref(rtdb, `matches/${matchId}`);

    const handleData = (snapshot: any) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setMatchData({ id: matchId, ...val } as any);
      } else {
        setMatchData(null);
      }
      setLoading(false);
    };

    onValue(matchRef, handleData, (error) => {
      console.error(`RTDB Error for match ${matchId}:`, error);
      setLoading(false);
    });

    return () => {
      off(matchRef, "value", handleData);
    };
  }, [matchId]);

  return { matchData, loading };
}

// 🌐 প্ল্যাটফর্মের সব অ্যাক্টিভ ম্যাচ পাওয়ার হুক
export function useAllLiveMatches() {
  const [matches, setMatches] = useState<{ id: string; data: MatchData }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchesRef = ref(rtdb, "matches");

    const handleData = (snapshot: any) => {
      if (snapshot.exists()) {
        const allData = snapshot.val();
        const activeList = Object.keys(allData)
          .map((id) => ({ id, data: allData[id] as MatchData }))
          .filter((m) => m.data?.meta?.status === "live");
        setMatches(activeList);
      } else {
        setMatches([]);
      }
      setLoading(false);
    };

    onValue(matchesRef, handleData);
    return () => {
      off(matchesRef, "value", handleData);
    };
  }, []);

  return { matches, loading };
}