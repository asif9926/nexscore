"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, MessageCircle, Code2, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // শুধুমাত্র /admin/login ছাড়া বাকি সব অ্যাডমিন পাথে হাইড থাকবে
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") return null;

  return (
    <footer className="relative z-20 mt-auto border-t border-border bg-ink/80 py-10 text-fg-muted backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          
          {/* Left: Brand Identity */}
          <div className="space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <span className="text-2xl font-black tracking-tight text-fg">NEXSCORE</span>
              <span className="rounded-full border border-electric/30 bg-electric/10 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-electric shadow-sm">
                V1.0
              </span>
            </div>
            <p className="max-w-md text-xs sm:text-sm leading-relaxed text-fg-muted">
              Next-Generation Live Sports Engine. Ultra-low latency scoreboard and broadcast overlay system for
              local cricket & football tournaments.
            </p>
          </div>

          {/* Right: Admin & Developer Info */}
          <div className="flex flex-col items-center md:items-end gap-4">
            
            {/* 1. Admin Portal Link */}
            <Link
              href="/admin/login"
              className="group flex items-center gap-2 text-sm font-semibold text-fg/80 transition-colors hover:text-fg"
            >
              <ShieldCheck size={18} className="text-electric group-hover:text-electric/80" />
              <span className="underline decoration-fg-faint underline-offset-4 group-hover:decoration-electric">
                Admin Control Portal
              </span>
            </Link>

            {/* 2. Premium Developer Card with Profile Link */}
            <div className="flex flex-col items-center md:items-end gap-2.5 rounded-2xl border border-border/50 bg-panel/40 p-4 shadow-sm backdrop-blur-md">
              <Link
                href="/about-developer"
                className="group flex items-center gap-1.5 text-xs text-fg-muted transition-colors hover:text-electric"
              >
                <Code2 size={14} className="text-electric" />
                <span>Engineered & Maintained by</span>
                <span className="font-bold text-fg group-hover:text-electric underline decoration-border underline-offset-2">
                  Tahmid
                </span>
                <ArrowUpRight size={13} className="opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              
              {/* WhatsApp Contact Button */}
              <a
                href="https://wa.me/8801XXXXXXXXX" // <-- আপনার আসল WhatsApp নাম্বার বসিয়ে দিন
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-full border border-[#25D366]/20 bg-[#25D366]/10 px-4 py-1.5 text-xs font-bold text-[#25D366] transition-all hover:bg-[#25D366]/20 hover:text-white shadow-sm"
              >
                <MessageCircle size={14} className="group-hover:animate-pulse" />
                <span>Developer Support</span>
              </a>
            </div>

          </div>
        </div>

        {/* Bottom: Status & Copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-6 text-xs text-fg-faint sm:flex-row">
          <div className="flex items-center gap-2 rounded-full border border-pitch-green/20 bg-pitch-green/5 px-3 py-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-pitch-green" />
            <span className="font-bold uppercase tracking-widest text-pitch-green/80">RTDB Stream Active</span>
          </div>
          <div className="font-medium">© {new Date().getFullYear()} NexScore Broadcasting.</div>
        </div>

      </div>
    </footer>
  );
}