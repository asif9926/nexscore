"use client";

import { ReactNode, useEffect } from "react";

export default function OverlayLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 🛡️ OVERLAY ISOLATION GUARD:
    // সাইটে সানলাইট/লাইট মোড সক্রিয় থাকলেও ওভারলে থেকে তা জোরপূর্বক রিমুভ করে ডার্ক ব্রডকাস্ট লক করবে
    document.documentElement.classList.remove("sunlight");
    document.documentElement.style.backgroundColor = "transparent";
    document.body.style.backgroundColor = "transparent";

    return () => {
      // ওভারলে ট্যাব বন্ধ হলে আগের সেভ করা থিম পুনরুদ্ধার করবে
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