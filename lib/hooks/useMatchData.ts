// lib/hooks/useMatchData.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
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

    const unsubscribe = onValue(
      matchRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setMatchData({ id: matchId, ...snapshot.val() } as any);
        } else {
          setMatchData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error(`RTDB Hook Error for match ${matchId}:`, error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [matchId]);

  return { matchData, loading };
}

// 🌐 প্ল্যাটফর্মের সব অ্যাক্টিভ লাইভ ম্যাচ পাওয়ার হাই-পারফরম্যান্স কুয়েরি
export function useAllLiveMatches() {
  const [matches, setMatches] = useState<{ id: string; data: MatchData }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ডাটাবেস লেভেলেই শুধুমাত্র লাইভ ম্যাচ ফিল্টার করা হচ্ছে (Zero Client-side bloat)
    const matchesQuery = query(
      ref(rtdb, "matches"),
      orderByChild("meta/status"),
      equalTo("live")
    );

    const unsubscribe = onValue(
      matchesQuery,
      (snapshot) => {
        if (snapshot.exists()) {
          const allData = snapshot.val();
          const activeList = Object.keys(allData).map((id) => ({
            id,
            data: allData[id] as MatchData,
          }));
          setMatches(activeList);
        } else {
          setMatches([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Failed to fetch live matches:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { matches, loading };
}