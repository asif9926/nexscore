// app/admin/layout.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminHeaderActions from "@/components/admin/AdminHeaderActions";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-ink font-sans text-fg transition-colors duration-200 selection:bg-electric/30">
      
      {/* Ambient Background Glow (Sunlight মোডে সফট থাকবে) */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden opacity-40 sm:block">
        <div className="absolute left-1/2 top-[-10%] h-96 w-full max-w-7xl -translate-x-1/2 rounded-full bg-electric/10 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-panel/90 p-3.5 backdrop-blur-xl shadow-sm sm:p-4">
        <Link href="/admin" className="group flex items-center gap-2.5 transition-transform active:scale-95">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-crimson shadow-[0_0_8px_rgba(220,38,38,0.6)]" />
          <h1 className="font-broadcast text-lg font-bold tracking-wider text-fg transition-colors group-hover:text-electric sm:text-xl">
            NEX<span className="text-electric">SCORE</span> <span className="ml-1 font-sans text-xs font-semibold tracking-normal text-fg-muted">CONTROL</span>
          </h1>
        </Link>

        <AdminHeaderActions />
      </header>

      <main className="relative z-10 mx-auto max-w-5xl p-3.5 sm:p-4 md:p-6">{children}</main>
    </div>
  );
}