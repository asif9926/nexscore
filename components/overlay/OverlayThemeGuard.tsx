// components/overlay/OverlayThemeGuard.tsx
"use client";

import { useEffect, ReactNode } from "react";

export default function OverlayThemeGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 🛡️ OBS Studio ব্রাউজার সোর্সে যেকোনো লাইট/সানলাইট ক্লাস সম্পূর্ণ রিমুভ ও স্বচ্ছ রাখা
    document.documentElement.classList.remove("sunlight");
    document.documentElement.style.backgroundColor = "transparent";
    document.documentElement.style.overflow = "hidden";
    document.body.style.backgroundColor = "transparent";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      
      // ওভারলে বন্ধ হলে পাবলিক পেজের পূর্ববর্তী থিম পুনরুদ্ধার
      const savedMode = typeof window !== "undefined" && localStorage.getItem("nexscore_sunlight") !== "false";
      if (savedMode) {
        document.documentElement.classList.add("sunlight");
      }
    };
  }, []);

  return (
    <div 
      data-overlay-root
      className="relative h-screen w-full overflow-hidden bg-transparent font-sans select-none antialiased [transform:translateZ(0)]"
    >
      {children}
    </div>
  );
}