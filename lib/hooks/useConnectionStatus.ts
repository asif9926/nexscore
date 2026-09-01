// lib/hooks/useConnectionStatus.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // 🛡️ ফায়ারবেস ইন্টারনাল মেটাপাথ (কোনো ডেটাবেস রাইট ছাড়াই কানেকশন চেক করে)
    const connectedRef = ref(rtdb, ".info/connected");

    const handleStatus = (snapshot: any) => {
      setIsOnline(snapshot.val() === true);
    };

    onValue(connectedRef, handleStatus);

    return () => {
      off(connectedRef, "value", handleStatus);
    };
  }, []);

  return isOnline;
}