"use client";

import Link from "next/link";
import { useMatchData } from "@/lib/hooks/useMatchData";
import ReconnectingBanner from "@/components/public-view/ReconnectingBanner";
import LiveMatchCenter from "@/components/public-view/LiveMatchCenter";
import { Trophy, ArrowLeft, History, Tv, ExternalLink } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function LiveMatchPage() {
  const { matchData, loading } = useMatchData();

  // ১. লোডিং স্টেট
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-ink text-fg">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-electric" />
            <p className="text-xs font-bold uppercase tracking-widest text-electric animate-pulse">
              Connecting to Live Feed...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ২. যদি কোনো অ্যাক্টিভ ম্যাচ না থাকে (Streamvex + Archives Promo Empty State)
  if (!matchData || !matchData.meta) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-fg selection:bg-electric/30">
        <Navbar />

        <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block">
          <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[100px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[100px] mix-blend-screen" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:py-20">
          <div className="w-full max-w-lg space-y-4 rounded-3xl border border-border bg-panel p-6 sm:p-10 shadow-2xl">
            {/* Trophy Icon */}
            <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-border bg-ink text-fg-faint shadow-inner">
              <Trophy size={28} className="text-signal-gold/80" />
            </div>

            {/* Typography */}
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-fg sm:text-2xl">No Match Currently Live</h2>
              <p className="mx-auto max-w-sm text-xs leading-relaxed text-fg-muted sm:text-sm">
                There are no local matches streaming on NexScore right now. You can watch live international matches or check completed match archives.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 space-y-2.5 flex flex-col items-center justify-center">
              {/* Highlighted Streamvex Button */}
              <a
                href="https://streamvex-live.vercel.app/" // আপনার Streamvex ওয়েবসাইটের URL বসিয়ে দিন
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-electric via-blue-600 to-indigo-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-electric/25 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Tv size={16} className="animate-pulse text-signal-gold shrink-0" />
                <span>Watch International Matches • Streamvex</span>
                <ExternalLink size={14} className="opacity-80 transition-transform group-hover:translate-x-0.5 shrink-0" />
              </a>

              {/* Secondary Navigation (Home & Archive) */}
              <div className="flex w-full flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <Link
                  href="/match-history"
                  className="flex min-h-[40px] w-full sm:flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-ink px-4 py-2 text-xs font-semibold text-fg-muted transition-colors hover:border-fg-faint hover:text-fg"
                >
                  <History size={14} className="text-signal-gold" />
                  <span>Match Archives</span>
                </Link>

                <Link
                  href="/"
                  className="flex min-h-[40px] w-full sm:flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-ink px-4 py-2 text-xs font-semibold text-fg-muted transition-colors hover:border-fg-faint hover:text-fg"
                >
                  <ArrowLeft size={14} className="text-electric" />
                  <span>Back to Home</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  // ৩. ম্যাচ লাইভ থাকলে লাইভ সেন্টার রেন্ডার হবে
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-fg selection:bg-electric/30">
      <Navbar />
      <ReconnectingBanner />

      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block">
        <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[100px] mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto mt-2 sm:mt-4 w-full max-w-5xl min-w-0 overflow-hidden px-3.5 pb-20 sm:px-6 md:p-6">
        <LiveMatchCenter matchData={matchData} />
      </div>
      <Footer />
    </div>
  );
}