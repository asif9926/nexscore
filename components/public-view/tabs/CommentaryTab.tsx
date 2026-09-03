// components/public-view/tabs/CommentaryTab.tsx
"use client";

import { useState, useEffect } from "react";
import { MatchData } from "@/lib/types/match";
import { Activity } from "lucide-react";
import MatchEventsList from "../MatchEventsList";

export default function CommentaryTab({ matchData }: { matchData: MatchData }) {
  const [filter, setFilter] = useState<"all" | "boundaries" | "wickets">("all");
  const { meta, cricket, football } = matchData || {};

  const [activeInningsTab, setActiveInningsTab] = useState<1 | 2>(cricket?.currentInnings || 1);

  useEffect(() => {
    if (cricket?.currentInnings) {
      setActiveInningsTab(cricket.currentInnings);
    }
  }, [cricket?.currentInnings]);

  if (meta?.sport !== "cricket") {
    return (
      <div className="space-y-5 rounded-3xl border border-border bg-panel p-6 shadow-xl">
        <h3 className="flex items-center gap-2 border-b border-border pb-4 text-base font-bold text-fg">
          <Activity className="h-5 w-5 text-pitch-green" />
          <span>Match Events &amp; Timeline</span>
        </h3>
        <MatchEventsList events={football?.events || []} teamAName={meta?.teamA || "Team A"} teamBName={meta?.teamB || "Team B"} />
      </div>
    );
  }

  if (!cricket) return null;

  const inn1 = cricket.innings1;
  const inn2 = cricket.innings2;

  const hasSecondInnings = Boolean(
    inn2 && ((inn2?.score || 0) > 0 || inn2?.overs !== "0.0" || cricket.currentInnings === 2)
  );

  const selectedInnings = activeInningsTab === 2 && hasSecondInnings ? inn2 : inn1;
  const recentBalls = selectedInnings?.recentBalls || [];

  const team1Name = inn1?.battingTeam === "teamA" ? meta.teamA : meta.teamB;
  const team2Name = inn1?.battingTeam === "teamA" ? meta.teamB : meta.teamA;

  // 🛡️ নির্ভুল বাউন্ডারি ও উইকেট ফিল্টারিং
  const filteredCommentary = recentBalls
    .filter((ball: any) => {
      const label = typeof ball === "string" ? ball : ball?.label || "";
      const isWicket = typeof ball === "object" ? !!ball.isWicket : label === "W";
      const isBoundary =
        label === "4" ||
        label === "6" ||
        (typeof ball === "object" && !ball.isExtra && (ball.runs === 4 || ball.runs === 6));

      if (filter === "boundaries") return isBoundary;
      if (filter === "wickets") return isWicket;
      return true;
    })
    .slice()
    .reverse();

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-panel p-6 shadow-xl">
      {/* Header & Filters */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-fg">
            <Activity className="h-5 w-5 text-electric" />
            <span>Live Ball-by-Ball Commentary</span>
          </h3>
          <p className="mt-1 text-xs text-fg-muted">সর্বশেষ বলগুলোর ধারাভাষ্য ও লাইভ আপডেট</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Innings Switcher with Team Names */}
          {hasSecondInnings && (
            <div className="flex rounded-full border border-border bg-ink p-1 text-xs">
              <button
                onClick={() => setActiveInningsTab(1)}
                className={`rounded-full px-3 py-1 font-bold transition-all ${
                  activeInningsTab === 1 ? "bg-panel-raised text-electric" : "text-fg-muted hover:text-fg"
                }`}
              >
                1st Inn ({team1Name})
              </button>
              <button
                onClick={() => setActiveInningsTab(2)}
                className={`rounded-full px-3 py-1 font-bold transition-all ${
                  activeInningsTab === 2 ? "bg-electric text-white" : "text-fg-muted hover:text-fg"
                }`}
              >
                2nd Inn ({team2Name})
              </button>
            </div>
          )}

          {/* Event Filter Pills */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-ink p-1 text-xs">
            {(["all", "boundaries", "wickets"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`min-h-[32px] whitespace-nowrap rounded-full px-3.5 py-1 font-bold transition-all ${
                  filter === f ? "bg-electric text-white shadow-md shadow-electric/20" : "text-fg-muted hover:text-fg"
                }`}
              >
                {f === "all" ? "All Balls" : f === "boundaries" ? "Boundaries" : "Wickets"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Commentary List */}
      <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filteredCommentary.length === 0 ? (
          <div className="p-8 text-center text-sm text-fg-faint">কোনো বলের ধারাভাষ্য পাওয়া যায়নি।</div>
        ) : (
          filteredCommentary.map((ball: any, idx: number) => {
            const itemKey = `${ball.ballNumber || idx}_${ball.timestamp || idx}`;

            // Legacy Fallback
            if (typeof ball === "string") {
              const isW = ball === "W";
              const is4 = ball === "4";
              const is6 = ball === "6";

              return (
                <div key={itemKey} className="rounded-2xl border border-border bg-ink p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-fg-muted">Recent Action</span>
                    <span className={`rounded-full px-2.5 py-0.5 font-broadcast text-xs font-bold ${
                      isW ? "bg-crimson text-white" : is4 || is6 ? "bg-electric text-white" : "bg-panel-raised text-fg"
                    }`}>
                      {isW ? "WICKET" : `${ball} RUNS`}
                    </span>
                  </div>
                  <p className="text-xs text-fg-muted">{ball} runs scored.</p>
                </div>
              );
            }

            // Real-time Ball Commentary Object
            const isWicket = !!ball.isWicket;
            const isFour = ball.label === "4" || (!ball.isExtra && ball.runs === 4);
            const isSix = ball.label === "6" || (!ball.isExtra && ball.runs === 6);
            const isExtra = !!ball.isExtra;

            let badgeColor = "border border-border bg-panel-raised text-fg/90";
            let badgeText = `${ball.runs} RUNS`;

            if (isWicket) {
              badgeColor = "bg-crimson text-white";
              badgeText = "WICKET";
            } else if (isFour) {
              badgeColor = "bg-electric text-white";
              badgeText = "FOUR";
            } else if (isSix) {
              badgeColor = "bg-signal-gold text-ink font-black";
              badgeText = "SIX";
            } else if (isExtra) {
              badgeColor = "bg-purple-600/30 text-purple-300 border border-purple-500/40";
              badgeText = ball.extraType ? ball.extraType.toUpperCase() : "EXTRA";
            }

            return (
              <div
                key={itemKey}
                className="rounded-2xl border border-border bg-ink p-4 text-sm transition-colors hover:bg-panel-raised"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full border border-border bg-panel-raised px-2.5 py-0.5 font-mono text-xs font-bold text-electric">
                      Ov {ball.ballNumber}
                    </span>
                    <span className="font-semibold text-fg text-xs sm:text-sm">
                      {ball.bowlerName} to {ball.batsmanName}
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 font-broadcast text-xs font-bold ${badgeColor}`}>
                    {badgeText}
                  </span>
                </div>
                <p className="pl-1 text-xs leading-relaxed text-fg-muted sm:text-sm">
                  {ball.text || `${ball.runs} runs scored from this delivery.`}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}