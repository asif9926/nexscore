// components/admin/AdminHeaderActions.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { LogOut, Sun, Moon } from "lucide-react";
import ConnectionStatusBadge from "@/components/admin/ConnectionStatusBadge";

export default function AdminHeaderActions() {
  const router = useRouter();

  // ☀️ ডিফল্ট হিসেবে Light / Day Mode (true)
  const [isSunlight, setIsSunlight] = useState(true);

  // ব্রাউজার লোড হলে চেক করবে: ইউজার নিজে থেকে ডার্ক মোড ('false') সেভ না করলে লাইট মোডই থাকবে
  useEffect(() => {
    const savedMode = localStorage.getItem("nexscore_sunlight");
    const shouldBeSunlight = savedMode !== "false";

    setIsSunlight(shouldBeSunlight);
    if (shouldBeSunlight) {
      document.documentElement.classList.add("sunlight");
    } else {
      document.documentElement.classList.remove("sunlight");
    }
  }, []);

  const toggleSunlightMode = () => {
    const nextMode = !isSunlight;
    setIsSunlight(nextMode);
    localStorage.setItem("nexscore_sunlight", String(nextMode));

    if (nextMode) {
      document.documentElement.classList.add("sunlight");
    } else {
      document.documentElement.classList.remove("sunlight");
    }
  };

  const handleLogout = async () => {
    try {
      // ১. Firebase ক্লায়েন্ট সাইন-আউট
      await signOut(auth);

      // ২. সার্ভার সাইড সেশন কুকি ডিলিট
      await fetch("/api/logout", {
        method: "POST",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // ৩. হার্ড রিফ্রেশ সহ ব্রাউজারকে ফ্রেশ লগইন পেজে পাঠানো
      window.location.href = "/admin/login";
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* ☀️ Sunlight / Day Mode Quick Toggle Button */}
      <button
        type="button"
        onClick={toggleSunlightMode}
        title={isSunlight ? "Switch to Dark Mode" : "Switch to Day Mode"}
        className={`flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
          isSunlight
            ? "border-amber-500/50 bg-amber-400/20 text-amber-600 shadow-sm"
            : "border-border bg-panel text-fg-muted hover:border-amber-400/40 hover:text-amber-400"
        }`}
      >
        {isSunlight ? (
          <Sun size={15} className="text-amber-500 animate-spin-slow" />
        ) : (
          <Moon size={15} className="text-fg-muted" />
        )}
        <span className="hidden sm:inline">{isSunlight ? "Day Mode" : "Dark Mode"}</span>
      </button>

      <ConnectionStatusBadge />

      <button
        type="button"
        onClick={handleLogout}
        className="flex min-h-[40px] items-center gap-2 rounded-xl border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:bg-panel-raised hover:text-crimson sm:px-4"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}