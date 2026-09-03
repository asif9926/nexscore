// lib/hooks/useConnectionStatus.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue, set, onDisconnect } from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

/**
 * RTDB লাইভ কানেকশন স্টেট ট্র্যাক করার হুক
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const connectedRef = ref(rtdb, ".info/connected");

    // 🛡️ মডুলার আনসাবস্ক্রাইব ক্লিনআপ
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      setIsOnline(snapshot.val() === true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isOnline;
}

/**
 * 🛡️ অ্যাডমিন প্রেজেন্স ও লাইভ হার্টবিট রেজিস্টার করার প্রোডাকশন হুক
 * অ্যাডমিন কন্ট্রোল রুমে ঢুকলে RTDB-তে সেশন তৈরি হবে এবং ট্যাব বন্ধ করলে
 * Firebase onDisconnect() দিয়ে স্বয়ংক্রিয়ভাবে সেশন রিমুভ হবে।
 */
export function useAdminPresence(matchId?: string, adminUid?: string) {
  useEffect(() => {
    if (!matchId || !adminUid) return;

    const connectedRef = ref(rtdb, ".info/connected");
    const sessionId = `sess_${adminUid.slice(0, 5)}_${Math.random().toString(36).substring(2, 7)}`;
    const adminPresenceRef = ref(rtdb, `matches/${matchId}/presence/admins/${sessionId}`);
    const lastPingRef = ref(rtdb, `matches/${matchId}/presence/lastPing`);

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(adminPresenceRef, true);
        set(lastPingRef, Date.now());

        // ব্রাউজার ক্লোজ বা ইন্টারনেট ড্রপ হলে অটো-রিমুভ
        onDisconnect(adminPresenceRef).remove();
        onDisconnect(lastPingRef).set(Date.now());
      }
    });

    return () => {
      unsubscribe();
      // পেজ ছেড়ে বের হলে তাৎক্ষণিক সেশন ক্লিনআপ
      set(adminPresenceRef, null);
    };
  }, [matchId, adminUid]);
}