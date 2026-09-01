// components/public-view/LiveMatchCenter.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, FileText, Activity, Users, TrendingUp, Info, Coins, MapPin, Trophy } from "lucide-react";
import { MatchData } from "@/lib/types/match";
import { useFootballClock } from "@/lib/hooks/useFootballClock";
import LiveTab from "./tabs/LiveTab";
import ScorecardTab from "./tabs/ScorecardTab";
import CommentaryTab from "./tabs/CommentaryTab";
import SquadsTab from "./tabs/SquadsTab";
import GraphsTab from "./tabs/GraphsTab";
import InfoTab from "./tabs/InfoTab";

function StatusBadge({ isCompleted }: { isCompleted: boolean }) {
  if (isCompleted) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-panel-raised px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-fg-muted shadow-sm">
        MATCH COMPLETED
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-crimson/40 bg-crimson/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-crimson shadow-sm">
      <span className="h-2 w-2 animate-pulse rounded-full bg-crimson" /> LIVE NOW
    </span>
  );
}

function MetaLine({ tournament, venue }: { tournament?: string; venue?: string }) {
  return (
    <p className="mt-1 flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-medium text-fg-muted sm:text-sm md:justify-start">
      <span className="min-w-0 truncate">{tournament || "Local Tournament"}</span>
      {venue && (
        <>
          <span className="shrink-0 text-fg-faint">•</span>
          <span className="flex min-w-0 items-center gap-1">
            <MapPin size={12} className="shrink-0 text-fg-faint" />
            <span className="min-w-0 truncate">{venue}</span>
          </span>
        </>
      )}
    </p>
  );
}

export default function LiveMatchCenter({ matchData }: { matchData: MatchData }) {
  const { meta, cricket, football } = matchData;
  const isCricket = meta.sport === "cricket";
  const isCompleted = meta.status === "completed";
  const [activeTab, setActiveTab] = useState<string>(isCompleted ? "scorecard" : "live");
  const footballClock = useFootballClock(football);

  const tabs = [
    { id: "live", label: "Live Center", icon: <Zap size={16} className="text-signal-gold" /> },
    { id: "scorecard", label: "Full Scoreboard", icon: <FileText size={16} className="text-electric" /> },
    { id: "commentary", label: "Commentary", icon: <Activity size={16} className="text-electric" /> },
    { id: "squads", label: "Playing XI", icon: <Users size={16} className="text-pitch-green" /> },
    { id: "graphs", label: "Stats & Graphs", icon: <TrendingUp size={16} className="text-signal-gold" /> },
    { id: "info", label: "Match Info", icon: <Info size={16} className="text-fg-muted" /> },
  ];

  const currentInnings = cricket ? (cricket.currentInnings === 2 ? cricket.innings2 : cricket.innings1) : undefined;
  const battingTeamName = currentInnings?.battingTeam === "teamA" ? meta.teamA : meta.teamB;
  const tossWinnerName = cricket?.toss.winner === "teamA" ? meta.teamA : cricket?.toss.winner === "teamB" ? meta.teamB : null;

  // 🎯 ডাইনামিক স্কোয়াড অল-আউট ক্যালকুলেশন
  const inn1 = cricket?.innings1;
  const inn2 = cricket?.innings2;
  const chasingSquadKey: "teamA" | "teamB" = 
  (inn2?.battingTeam as "teamA" | "teamB") || (inn1?.battingTeam === "teamA" ? "teamB" : "teamA");
  const squadLength = cricket?.squads?.[chasingSquadKey]?.length || 11;
  const maxWickets = Math.max(1, squadLength - 1);

  return (
    <div className="relative w-full min-w-0 space-y-6 text-fg">
      {/* Header */}
      <div className="relative min-w-0 w-full overflow-hidden rounded-2xl border border-border bg-panel p-4 shadow-2xl sm:p-7">
        <div className="pointer-events-none absolute right-0 top-0 hidden h-72 w-72 rounded-full bg-electric/10 blur-3xl sm:block" />
        <div className="pointer-events-none absolute bottom-0 left-0 hidden h-72 w-72 rounded-full bg-signal-gold/10 blur-3xl sm:block" />

        <div className="relative z-10 flex min-w-0 flex-col items-center gap-4 md:flex-row md:items-start md:justify-between sm:gap-6">
          <div className="min-w-0 w-full space-y-2 text-center md:text-left">
            <div className="flex justify-center md:justify-start">
              <StatusBadge isCompleted={isCompleted} />
            </div>

            <h1 className="text-xl font-black tracking-tight text-fg sm:text-3xl md:text-4xl break-words">
              <span>{meta.teamA}</span>
              <span className="mx-1 text-sm font-medium text-fg-faint sm:text-2xl"> vs </span>
              <span>{meta.teamB}</span>
            </h1>

            <MetaLine tournament={meta.tournament} venue={meta.venue} />

            {/* Sport-specific context */}
            {isCricket ? (
              <div className="flex flex-col items-center gap-1.5 pt-0.5 md:items-start">
                {tossWinnerName && cricket?.toss.decision && (
                  <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                    <Coins size={12} className="shrink-0 text-signal-gold" />
                    <span className="truncate">
                      <strong className="text-fg">{tossWinnerName}</strong> won toss, chose to{" "}
                      <strong className="uppercase text-fg">{cricket.toss.decision}</strong>
                    </span>
                  </span>
                )}
                {!isCompleted && battingTeamName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-electric/20 bg-electric/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-electric">
                    🏏 {battingTeamName} batting
                  </span>
                )}
              </div>
            ) : (
              !isCompleted && (
                <div className="flex items-center justify-center gap-2 pt-0.5 md:justify-start">
                  <span className="rounded-full border border-pitch-green/20 bg-pitch-green/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-pitch-green">
                    {football?.half || "1ST HALF"}
                  </span>
                  {football?.isRunning && (
                    <span className="font-mono text-xs font-bold text-fg-muted">{footballClock.display}'</span>
                  )}
                  {((football?.redCardsA ?? 0) > 0 || (football?.redCardsB ?? 0) > 0) && (
                    <span className="flex items-center gap-1 text-xs text-crimson">
                      <span className="h-3 w-2 rounded-sm bg-crimson" />
                      {(football?.redCardsA ?? 0) + (football?.redCardsB ?? 0)}
                    </span>
                  )}
                </div>
              )
            )}
          </div>

          {/* Score chip */}
          <div
            className={`w-full shrink-0 rounded-2xl border ${
              isCricket ? "border-electric/30" : "border-pitch-green/30"
            } bg-ink p-4 sm:px-6 sm:py-4 md:w-auto md:min-w-[280px]`}
          >
            {isCricket ? (
              isCompleted ? (
                <div className="space-y-2.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
                      <span className="truncate text-fg-muted">
                        {inn1?.battingTeam === "teamA" ? meta.teamA : meta.teamB}:
                      </span>
                      <span className="font-score text-lg sm:text-xl text-electric shrink-0">
                        {inn1?.score || 0}/{inn1?.wickets || 0}{" "}
                        <span className="font-sans text-[11px] text-fg-faint font-normal">
                          ({inn1?.overs || "0.0"} ov)
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
                      <span className="truncate text-fg-muted">
                        {inn1?.battingTeam === "teamA" ? meta.teamB : meta.teamA}:
                      </span>
                      <span className="font-score text-lg sm:text-xl text-signal-gold shrink-0">
                        {inn2 ? `${inn2.score}/${inn2.wickets}` : "DNB"}{" "}
                        <span className="font-sans text-[11px] text-fg-faint font-normal">
                          ({inn2?.overs || "0.0"} ov)
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 rounded-xl border border-signal-gold/40 bg-signal-gold/15 px-3 py-1.5 text-center text-xs font-bold text-signal-gold">
                    <Trophy size={13} className="shrink-0 text-signal-gold" />
                    <span className="truncate">
                      {(() => {
                        const inn1Team = inn1?.battingTeam === "teamA" ? meta.teamA : meta.teamB;
                        const inn2Team = inn1?.battingTeam === "teamA" ? meta.teamB : meta.teamA;
                        const targetScore = (inn1?.score || 0) + 1;

                        if (inn2) {
                          if (inn2.score >= targetScore) {
                            return `${inn2Team} won by ${Math.max(0, maxWickets - (inn2.wickets || 0))} wkts`;
                          }
                          const diff = (inn1?.score || 0) - inn2.score;
                          return diff > 0 ? `${inn1Team} won by ${diff} runs` : "Match Tied";
                        }
                        return "Match Completed";
                      })()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center md:items-end">
                  <div className="font-score text-4xl leading-none text-fg sm:text-5xl">
                    {currentInnings?.score ?? 0}
                    <span className="mx-1 text-2xl text-fg-faint sm:text-3xl">/</span>
                    {currentInnings?.wickets ?? 0}
                  </div>
                  <div className="mt-1.5 inline-block rounded-full bg-panel px-3 py-0.5 font-broadcast text-xs sm:text-sm text-fg-muted">
                    Overs: <span className="font-bold text-fg">{currentInnings?.overs || "0.0"}</span>
                  </div>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center md:items-end">
                <div className="font-score text-4xl leading-none text-fg sm:text-5xl">
                  {football?.scoreA ?? 0} <span className="mx-1 text-2xl text-fg-faint">-</span> {football?.scoreB ?? 0}
                </div>
                <div className="mt-1.5 inline-block rounded-full bg-panel px-3 py-0.5 font-broadcast text-xs sm:text-sm text-fg-muted">
                  <span className="font-bold text-fg">{football?.half || "FULL TIME"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto border-b border-border pb-2.5 pt-1 px-1 -mx-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs
          .filter((tab) => !(isCompleted && tab.id === "live"))
          .filter((tab) => isCricket || (tab.id !== "graphs" && tab.id !== "commentary"))
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`snap-start flex min-h-[40px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all sm:text-sm sm:px-5 sm:py-2.5 ${
                activeTab === tab.id
                  ? "bg-electric text-white shadow-lg shadow-electric/25 scale-[1.02]"
                  : "border border-border bg-panel text-fg-muted hover:text-fg"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
      </div>

      <div className="min-h-[400px] min-w-0">
        <AnimatePresence mode="wait">
          {activeTab === "live" && <LiveTab key="tab-live" matchData={matchData} />}
          {activeTab === "scorecard" && <ScorecardTab key="tab-scorecard" matchData={matchData} />}
          {activeTab === "commentary" && <CommentaryTab key="tab-commentary" matchData={matchData} />}
          {activeTab === "squads" && <SquadsTab key="tab-squads" matchData={matchData} />}
          {activeTab === "graphs" && <GraphsTab key="tab-graphs" matchData={matchData} />}
          {activeTab === "info" && <InfoTab key="tab-info" matchData={matchData} />}
        </AnimatePresence>
      </div>
    </div>
  );
}