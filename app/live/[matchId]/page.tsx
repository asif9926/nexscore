// app/live/[matchId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useMatchData } from "@/lib/hooks/useMatchData";
import ReconnectingBanner from "@/components/public-view/ReconnectingBanner";
import LiveMatchCenter from "@/components/public-view/LiveMatchCenter";
import { Trophy, ArrowLeft, History } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function SingleLiveMatchPage() {
  const params = useParams();
  const matchId = params?.matchId as string;
  const { matchData, loading } = useMatchData(matchId);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-ink text-fg">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-electric" />
            <p className="text-xs font-bold uppercase tracking-widest text-electric animate-pulse">
              Connecting to Live Match Feed...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!matchData || !matchData.meta) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
        <Navbar />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-panel p-8 shadow-2xl">
            <Trophy size={32} className="mx-auto text-signal-gold" />
            <h2 className="text-xl font-bold text-fg">Match Not Found or Ended</h2>
            <p className="text-xs text-fg-muted">
              এই ম্যাচটি বর্তমানে লাইভ নেই বা ইতোমধ্যে সমাপ্ত করে আর্কাইভ করা হয়েছে।
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/live">
                <button className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-electric px-4 py-2 text-xs font-bold text-white">
                  View All Live Matches
                </button>
              </Link>
              <Link href="/match-history">
                <button className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-ink px-4 py-2 text-xs font-semibold text-fg-muted hover:text-fg">
                  <History size={14} /> Check Archives
                </button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
      <Navbar />
      <ReconnectingBanner />

      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block">
        <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto mt-2 sm:mt-4 w-full max-w-5xl min-w-0 overflow-hidden px-3.5 pb-20 sm:px-6 md:p-6">
        <div className="mb-4">
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-panel px-3.5 py-1 text-xs font-semibold text-fg-muted hover:text-fg"
          >
            <ArrowLeft size={13} className="text-electric" /> Back to Live Matches Hub
          </Link>
        </div>

        <LiveMatchCenter matchData={matchData} />
      </div>

      <Footer />
    </div>
  );
}