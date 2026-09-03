// lib/context/MatchDataContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase/client";
import { MatchData } from "../types/match";

interface MatchDataContextValue {
  matchData: MatchData | null;
  loading: boolean;
  matchId: string;
}

const MatchDataContext = createContext<MatchDataContextValue>({
  matchData: null,
  loading: true,
  matchId: "",
});

export function MatchDataProvider({
  matchId,
  children,
}: {
  matchId: string;
  children: ReactNode;
}) {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) {
      setMatchData(null);
      setLoading(false);
      return;
    }

    // সঠিক ম্যাচ পাথে লিসেনার অ্যাটাচ
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
        console.error(`RTDB Context error on match ${matchId}:`, error);
        setLoading(false);
      }
    );

    // লিসেনার ক্লিনআপ (Memory leak-free)
    return () => unsubscribe();
  }, [matchId]);

  return (
    <MatchDataContext.Provider value={{ matchData, loading, matchId }}>
      {children}
    </MatchDataContext.Provider>
  );
}

export function useMatchContext() {
  const context = useContext(MatchDataContext);
  if (!context) {
    throw new Error("useMatchContext must be used within a MatchDataProvider");
  }
  return context;
}