// lib/hooks/useConnectionStatus.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const connectedRef = ref(rtdb, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setIsOnline(snapshot.val() === true);
    });
    return () => unsubscribe();
  }, []);

  return isOnline;
}

export function useAdminPresence(matchId?: string, adminUid?: string) {
  useEffect(() => {
    if (!matchId || !adminUid) return;

    const connectedRef = ref(rtdb, ".info/connected");
    const sessionId = `sess_${adminUid.slice(0, 5)}_${Math.random().toString(36).substring(2, 7)}`;
    const adminPresenceRef = ref(rtdb, `matches/${matchId}/presence/admins/${sessionId}`);
    const lastPingRef = ref(rtdb, `matches/${matchId}/presence/lastPing`);

    const disconnectPresence = onDisconnect(adminPresenceRef);
    const disconnectPing = onDisconnect(lastPingRef);

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(adminPresenceRef, true);
        set(lastPingRef, Date.now());

        disconnectPresence.remove();
        disconnectPing.set(Date.now());
      }
    });

    return () => {
      unsubscribe();
      // 🛡️ Fix #18: Cancel disconnect handlers to prevent memory and path leaks
      disconnectPresence.cancel();
      disconnectPing.cancel();
      set(adminPresenceRef, null);
    };
  }, [matchId, adminUid]);
}