// app/live/page.tsx
"use client";

import Link from "next/link";
import { useAllLiveMatches } from "@/lib/hooks/useMatchData";
import { Trophy, ArrowRight, History, Tv, ExternalLink, Activity } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function LiveMatchesHubPage() {
  const { matches: liveMatches, loading } = useAllLiveMatches();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-ink text-fg">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-electric" />
            <p className="text-xs font-bold uppercase tracking-widest text-electric animate-pulse">
              Scanning Live On-Air Matches...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
      <Navbar />

      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block">
        <div className="absolute left-[-10%] top-[-10%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-border pb-5 sm:mb-8 md:flex-row md:items-end">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-crimson">
              <span className="h-2 w-2 animate-ping rounded-full bg-crimson" /> Real-Time Broadcast Hub
            </div>
            <h1 className="text-2xl font-black tracking-tight text-fg sm:text-4xl">Live Matches On Air</h1>
            <p className="mt-1.5 max-w-xl text-xs text-fg-muted sm:text-sm">
              All ongoing local tournament broadcasts powered by NexScore Engine. Select a match to view ball-by-ball commentary and full digital scorecard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-pitch-green/30 bg-pitch-green/10 px-3 py-1 font-mono text-xs font-bold text-pitch-green">
              {liveMatches.length} Live Match{liveMatches.length !== 1 ? "es" : ""} Active
            </span>
          </div>
        </div>

        {/* ❌ কোনো ম্যাচ লাইভ না থাকলে */}
        {liveMatches.length === 0 ? (
          <div className="my-10 flex flex-col items-center justify-center rounded-3xl border border-border bg-panel p-8 text-center shadow-2xl sm:p-14">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-ink text-fg-faint">
              <Trophy size={28} className="text-signal-gold/80" />
            </div>
            <h3 className="text-lg font-bold text-fg sm:text-xl">No Local Match Currently Live</h3>
            <p className="mx-auto mt-1 max-w-md text-xs text-fg-muted sm:text-sm">
              There are no local matches streaming on NexScore right now. You can check match archives or explore international streams.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/match-history">
                <button className="flex min-h-[42px] items-center gap-2 rounded-full border border-border bg-ink px-5 py-2 text-xs font-bold text-fg-muted hover:text-fg">
                  <History size={14} className="text-signal-gold" /> Match Archives
                </button>
              </Link>
              <a
                href="https://streamvex-live.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[42px] items-center gap-2 rounded-full bg-electric px-5 py-2 text-xs font-bold text-white shadow-lg shadow-electric/25"
              >
                <Tv size={14} /> International Matches
              </a>
            </div>
          </div>
        ) : (
          /* ✅ মাল্টিপল লাইভ ম্যাচ গ্রিড */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {liveMatches.map(({ id, data }) => {
              const { meta, cricket, football } = data;
              const isCricket = meta.sport === "cricket";
              const currentInnings = cricket?.currentInnings === 2 ? cricket?.innings2 : cricket?.innings1;

              return (
                <div
                  key={id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-panel p-5 shadow-xl transition-all hover:border-electric/50 hover:shadow-2xl"
                >
                  <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-electric via-pitch-green to-signal-gold" />

                  <div className="space-y-4">
                    {/* Status Row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-crimson" />
                        <span className="font-bold uppercase text-crimson text-[10px]">ON AIR</span>
                        <span className="text-fg-faint">•</span>
                        <span className="font-semibold text-fg-muted text-[11px] truncate max-w-[150px]">
                          {meta.tournament || "Tournament"}
                        </span>
                      </div>
                      <span className="rounded-md border border-border bg-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-electric">
                        {meta.sport}
                      </span>
                    </div>

                    {/* Match Name */}
                    <div>
                      <h3 className="text-lg font-bold text-fg">
                        {meta.teamA} <span className="text-xs font-normal text-fg-faint">vs</span> {meta.teamB}
                      </h3>
                      {isCricket && currentInnings ? (
                        <p className="text-[11px] text-electric font-semibold">
                          🏏 {currentInnings.battingTeam === "teamA" ? meta.teamA : meta.teamB} batting
                        </p>
                      ) : (
                        <p className="text-[11px] text-pitch-green font-semibold">
                          ⚽ {football?.half || "Live Match"}
                        </p>
                      )}
                    </div>

                    {/* Live Score Display */}
                    <div className="rounded-2xl border border-border/80 bg-ink/70 p-3.5 flex items-center justify-between">
                      {isCricket ? (
                        <>
                          <div className="font-score text-3xl font-black text-fg">
                            {currentInnings?.score || 0}
                            <span className="text-lg text-fg-faint mx-0.5">/</span>
                            {currentInnings?.wickets || 0}
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-bold text-fg">{currentInnings?.overs || "0.0"} ov</div>
                            <div className="text-[10px] text-fg-muted">Max: {cricket?.maxOvers} ov</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-score text-3xl font-black text-fg">
                            {football?.scoreA || 0} - {football?.scoreB || 0}
                          </div>
                          <div className="text-right text-xs font-bold text-pitch-green">
                            {football?.half || "1ST HALF"}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-5">
                    <Link href={`/live/${id}`} className="block w-full">
                      <button className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-electric px-4 py-2 text-xs font-bold text-white shadow-md shadow-electric/20 transition-all group-hover:scale-[1.02]">
                        <Activity size={14} />
                        <span>Enter Match Center</span>
                        <ArrowRight size={14} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}