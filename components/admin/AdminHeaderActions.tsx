// components/admin/AdminHeaderActions.tsx
"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { LogOut } from "lucide-react";
import ConnectionStatusBadge from "@/components/admin/ConnectionStatusBadge";

export default function AdminHeaderActions() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // ১. সার্ভার সাইড সেশন কুকি ক্লিয়ার করা
      await fetch("/api/logout");
      // ২. Firebase ক্লায়েন্ট সাইনআউট
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <ConnectionStatusBadge />
      <button
        onClick={handleLogout}
        className="flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-semibold text-fg-muted transition-colors hover:bg-panel-raised hover:text-crimson sm:px-4"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}