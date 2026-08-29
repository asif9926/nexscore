// lib/hooks/useConnectionStatus.ts
import { useEffect, useState } from 'react';
import { ref, onValue, onDisconnect, set, remove } from 'firebase/database';
import { rtdb } from '../firebase/client';

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const connectedRef = ref(rtdb, '.info/connected');
    
    // ✅ FIXED: একাধিক ট্যাব/অ্যাডমিনের জন্য ইউনিক সেশন আইডি তৈরি
    const sessionId = Math.random().toString(36).substring(2, 15);
    const presenceRef = ref(rtdb, `match/presence/admins/${sessionId}`);
    const lastPingRef = ref(rtdb, 'match/presence/lastPing');

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        setIsOnline(true);
        
        // সেশন আইডিতে presence ট্রু করা হচ্ছে
        set(presenceRef, true);
        set(lastPingRef, Date.now());
        
        // ✅ FIXED: এই নির্দিষ্ট ট্যাবটি বন্ধ হলে শুধু তার ডেটাই রিমুভ হবে
        onDisconnect(presenceRef).remove();
      } else {
        setIsOnline(false);
      }
    });

    return () => {
      unsubscribe();
      // FIXED: কম্পোনেন্ট আনমাউন্ট হলে (পেজ চেঞ্জ করলে) ম্যানুয়ালি ক্লিনআপ
      remove(presenceRef);
    };
  }, []);

  return isOnline;
}
