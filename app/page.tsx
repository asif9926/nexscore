import Link from "next/link";
import { FileText, Activity, ShieldCheck, ArrowRight, Radio } from "lucide-react";
import { adminFirestore } from "@/lib/firebase/admin";
import LiveMatchSection from "@/components/landing/LiveMatchSection";
import RecentMatchesList from "@/components/landing/RecentMatchesList";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export const revalidate = 60;

export default async function LandingPage() {
  let recentMatches: any[] = [];
  try {
    const snapshot = await adminFirestore
      .collection("matches_history")
      .orderBy("completedAt", "desc")
      .limit(2)
      .get();
    recentMatches = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching recent matches for landing page:", error);
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-ink text-fg selection:bg-electric/30">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 z-0 hidden sm:block">
        <div className="absolute left-1/2 top-[-10%] h-96 w-full max-w-7xl -translate-x-1/2 rounded-full bg-electric/10 blur-[100px]" />
        <div className="absolute left-[-10%] top-[20%] h-[50vh] w-[50vw] rounded-full bg-electric/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50vh] w-[50vw] rounded-full bg-signal-gold/10 blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl min-w-0 overflow-hidden px-3.5 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <section className="relative mx-auto flex max-w-4xl flex-col items-center justify-center space-y-4 pt-6 pb-4 text-center sm:space-y-6 sm:pt-12 sm:pb-8 min-w-0 w-full">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-fg/80 shadow-sm backdrop-blur-md transition-colors hover:border-electric/50 sm:px-4 sm:py-1.5 sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-electric" />
            </span>
            <span>NexScore Engine v1.0</span>
          </div>

          <div className="space-y-2.5 sm:space-y-4 px-1">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-fg sm:text-5xl md:text-6xl break-words">
              Live Sports Broadcast, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-electric via-purple-400 to-signal-gold bg-clip-text text-transparent drop-shadow-sm">
                Elevated.
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-xs font-medium leading-relaxed text-fg-muted sm:text-sm md:text-base">
              Ultra-low latency scoring system. Synchronized scorecards, ball-by-ball commentary, and OBS-ready graphics in milliseconds.
            </p>
          </div>

          <div className="flex w-full flex-col items-center justify-center gap-2.5 pt-1 sm:w-auto sm:flex-row sm:gap-3.5 sm:pt-2">
            <Link 
              href="/live" 
              className="flex w-full items-center justify-center gap-2 rounded-full bg-electric px-6 py-2.5 text-xs font-bold text-ink shadow-md shadow-electric/20 transition-all hover:scale-105 active:scale-95 sm:w-auto sm:px-7 sm:py-3 sm:text-sm"
            >
              <Radio size={16} className="animate-pulse" /> Watch Live Center
            </Link>
            <Link 
              href="/match-history" 
              className="group flex w-full items-center justify-center gap-2 rounded-full border border-border bg-panel px-6 py-2.5 text-xs font-bold text-fg shadow-sm transition-all hover:border-fg-faint hover:bg-fg/5 sm:w-auto sm:px-7 sm:py-3 sm:text-sm"
            >
              Explore Archives 
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 text-fg-muted group-hover:text-fg" />
            </Link>
          </div>
        </section>

        <div className="relative z-20 mb-8 sm:mb-12 w-full min-w-0">
          <LiveMatchSection />
        </div>

        <section className="space-y-6 pt-1 min-w-0">
          <div className="mx-auto max-w-xl space-y-1.5 text-center px-2">
            <span className="inline-block rounded-full border border-border bg-panel px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-electric sm:text-[11px]">
              Professional Grade
            </span>
            <h2 className="text-2xl font-black text-fg sm:text-3xl">Complete Cricbuzz Experience</h2>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:gap-5 md:grid-cols-3">
            <div className="group space-y-3 rounded-2xl border border-border bg-panel p-4.5 transition-all hover:border-electric/30 sm:rounded-3xl sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-electric/40 bg-electric/15 font-bold text-electric shadow-sm sm:h-12 sm:w-12">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="mb-1 text-base font-bold text-fg sm:text-lg">In-Depth Scorecards</h3>
                <p className="text-xs leading-relaxed text-fg-muted sm:text-sm">
                  Complete batting and bowling tables with strike rates, economy, extras breakdown, and fall of wickets timeline.
                </p>
              </div>
            </div>

            <div className="group space-y-3 rounded-2xl border border-border bg-panel p-4.5 transition-all hover:border-signal-gold/30 sm:rounded-3xl sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-signal-gold/40 bg-signal-gold/15 font-bold text-signal-gold shadow-sm sm:h-12 sm:w-12">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="mb-1 text-base font-bold text-fg sm:text-lg">Live Commentary</h3>
                <p className="text-xs leading-relaxed text-fg-muted sm:text-sm">
                  Filterable ball-by-ball text commentary, recent over timelines, and beautiful scoring distribution breakdowns.
                </p>
              </div>
            </div>

            <div className="group space-y-3 rounded-2xl border border-border bg-panel p-4.5 transition-all hover:border-pitch-green/30 sm:rounded-3xl sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-pitch-green/40 bg-pitch-green/15 font-bold text-pitch-green shadow-sm sm:h-12 sm:w-12">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="mb-1 text-base font-bold text-fg sm:text-lg">Zero-Delay Logic</h3>
                <p className="text-xs leading-relaxed text-fg-muted sm:text-sm">
                  Sub-millisecond synchronization between the Admin Console, OBS Overlays, and Public Views with instant rollback logic.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 sm:mt-12 border-t border-border pt-6 sm:pt-8">
          <RecentMatchesList matches={recentMatches} />
        </div>
      </div>

      <Footer />
    </div>
  );
}