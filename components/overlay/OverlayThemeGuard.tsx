// components/overlay/OverlayThemeGuard.tsx
"use client";

import { useEffect, ReactNode } from "react";

export default function OverlayThemeGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 🛡️ ওভারলে থেকে লাইট/সানলাইট মোড রিমুভ করে ট্রান্সপারেন্ট ব্রডকাস্ট ডার্ক ব্যাকগ্রাউন্ড নিশ্চিত করা
    document.documentElement.classList.remove("sunlight");
    document.documentElement.style.backgroundColor = "transparent";
    document.body.style.backgroundColor = "transparent";

    return () => {
      // ওভারলে বন্ধ হলে আগের সেভ করা থিম পুনরুদ্ধার করা
      const savedMode = localStorage.getItem("nexscore_sunlight") === "true";
      if (savedMode) {
        document.documentElement.classList.add("sunlight");
      }
    };
  }, []);

  return (
    <div 
      data-overlay-root
      className="relative min-h-screen w-full overflow-hidden bg-transparent font-sans select-none antialiased [transform:translateZ(0)]"
    >
      {children}
    </div>
  );
}