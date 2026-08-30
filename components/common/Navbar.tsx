"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radio, History, Home, Sun, Moon } from "lucide-react";
import { useMatchData } from "@/lib/hooks/useMatchData";

export default function Navbar() {
  const pathname = usePathname();
  const { matchData } = useMatchData();
  const isLive = matchData?.meta?.status === "live";

  const [isSunlight, setIsSunlight] = useState(false);

  // ব্রাউজার লোড হলে আগের সেভ করা থিম চেক করবে
  useEffect(() => {
    const savedMode = localStorage.getItem("nexscore_sunlight") === "true";
    setIsSunlight(savedMode);
    if (savedMode) {
      document.documentElement.classList.add("sunlight");
    } else {
      document.documentElement.classList.remove("sunlight");
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = !isSunlight;
    setIsSunlight(nextMode);
    localStorage.setItem("nexscore_sunlight", String(nextMode));

    if (nextMode) {
      document.documentElement.classList.add("sunlight");
    } else {
      document.documentElement.classList.remove("sunlight");
    }
  };

  // শুধুমাত্র /admin/login ছাড়া বাকি সব অ্যাডমিন পাথে হাইড থাকবে
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-ink/90 backdrop-blur-xl shadow-sm transition-colors duration-200">
      <div className="mx-auto flex h-16 sm:h-20 w-full max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Left: Brand Logo */}
        <Link href="/" className="group flex items-center gap-2 transition-transform active:scale-95 shrink-0">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-electric font-broadcast text-base sm:text-xl font-bold text-white shadow-md shadow-electric/30">
            N<span className="text-signal-gold">S</span>
          </div>
          <div>
            <span className="text-base sm:text-xl font-black tracking-tight text-fg transition-colors group-hover:text-electric">
              NexScore
            </span>
          </div>
        </Link>

        {/* Right: Navigation Links & Theme Toggle */}
        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/"
            aria-label="Home"
            className={`flex h-9 items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold transition-all active:scale-95 sm:px-4 ${
              pathname === "/" ? "border border-border bg-panel-raised text-fg shadow-sm" : "text-fg-muted hover:bg-panel hover:text-fg"
            }`}
          >
            <Home size={15} className={pathname === "/" ? "text-electric" : ""} />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <Link
            href="/live"
            className={`flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-all active:scale-95 sm:px-4 ${
              pathname === "/live" ? "bg-electric text-white shadow-md shadow-electric/25" : "text-fg-muted hover:bg-panel hover:text-fg"
            }`}
          >
            <Radio size={14} className={isLive ? "animate-pulse text-crimson" : pathname === "/live" ? "text-white" : ""} />
            <span>Live</span>
          </Link>

          <Link
            href="/match-history"
            aria-label="Archives"
            className={`flex h-9 items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold transition-all active:scale-95 sm:px-4 ${
              pathname.startsWith("/match-history")
                ? "border border-border bg-panel-raised text-fg shadow-sm"
                : "text-fg-muted hover:bg-panel hover:text-fg"
            }`}
          >
            <History size={15} className={pathname.startsWith("/match-history") ? "text-signal-gold" : ""} />
            <span className="hidden sm:inline">Archives</span>
          </Link>

          {/* ☀️ / 🌙 Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title={isSunlight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-border transition-all active:scale-95 ${
              isSunlight
                ? "bg-amber-400/20 border-amber-500/40 text-amber-500 shadow-sm"
                : "bg-panel text-fg-muted hover:border-fg-faint hover:text-fg"
            }`}
          >
            {isSunlight ? <Sun size={16} className="text-amber-500" /> : <Moon size={15} />}
          </button>
        </nav>
      </div>
    </header>
  );
}