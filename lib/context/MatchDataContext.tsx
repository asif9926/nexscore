// lib/context/MatchDataContext.tsx
// আগে প্রতিটা কম্পোনেন্ট useMatchData() কল করলে নিজের একটা আলাদা RTDB onValue()
// লিসেনার খুলত — cricket overlay পেজে (ScoreBar + EventPopup + ReconnectingBanner
// + LogoBadge) একসাথে ৪টা পর্যন্ত ডুপ্লিকেট লিসেনার চলত একই পেজে।
// এখন রুট লেআউটে একবার Provider বসিয়ে পুরো অ্যাপে একটাই কানেকশন শেয়ার হয়।
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase/client";
import { MatchData } from "../types/match";

interface MatchDataContextValue {
  matchData: MatchData | null;
  loading: boolean;
}

const MatchDataContext = createContext<MatchDataContextValue>({ matchData: null, loading: true });

export function MatchDataProvider({ children }: { children: ReactNode }) {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchRef = ref(rtdb, "match");
    const unsubscribe = onValue(matchRef, (snapshot) => {
      setMatchData(snapshot.exists() ? (snapshot.val() as MatchData) : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <MatchDataContext.Provider value={{ matchData, loading }}>
      {children}
    </MatchDataContext.Provider>
  );
}

/** পুরনো `useMatchData()` হুকের মতোই সিগনেচার — ইম্পোর্ট পাথ ছাড়া আর কিছু বদলাতে হয়নি */
export function useMatchData() {
  return useContext(MatchDataContext);
}
