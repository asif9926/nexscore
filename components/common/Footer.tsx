// components/common/Footer.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, MessageCircle, Code2, ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/config/site";

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
            <p className="max-w-md text-xs leading-relaxed text-fg-muted sm:text-sm">
              Next-Generation Live Sports Engine. Ultra-low latency scoreboard and broadcast overlay system for
              local cricket &amp; football tournaments.
            </p>
          </div>

          {/* Right: Admin & Developer Info */}
          <div className="flex flex-col items-center gap-4 md:items-end">
            
            {/* 🛡️ ফিক্সড: <a> ট্যাগ ব্যবহারের ফলে কোনো প্রিফেচ হ্যাং বা রাউটার লক হবে না */}
            <a
              href="/admin"
              className="group flex items-center gap-2 text-sm font-semibold text-fg/80 transition-colors hover:text-fg"
            >
              <ShieldCheck size={18} className="text-electric group-hover:text-electric/80" />
              <span className="underline decoration-fg-faint underline-offset-4 group-hover:decoration-electric">
                Admin Control Portal
              </span>
            </a>

            {/* Developer Card */}
            <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-border/50 bg-panel/40 p-4 shadow-sm backdrop-blur-md md:items-end">
              <Link
                href="/about-developer"
                className="group flex items-center gap-1.5 text-xs text-fg-muted transition-colors hover:text-electric"
              >
                <Code2 size={14} className="text-electric" />
                <span>Engineered &amp; Maintained by</span>
                <span className="font-bold text-fg underline decoration-border underline-offset-2 group-hover:text-electric">
                  Asif
                </span>
                <ArrowUpRight size={13} className="opacity-70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              
              <a
                href={siteConfig.developer.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-full border border-[#25D366]/20 bg-[#25D366]/10 px-4 py-1.5 text-xs font-bold text-[#25D366] shadow-sm transition-all hover:bg-[#25D366]/20 hover:text-white"
              >
                <MessageCircle size={14} className="group-hover:animate-pulse" />
                <span>Developer Support</span>
              </a>
            </div>

          </div>
        </div>

        {/* Bottom Status */}
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