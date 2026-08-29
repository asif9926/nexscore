"use client";

import { useState } from "react";
import { MatchData } from "@/lib/types/match";
import { Activity } from "lucide-react";
import MatchEventsList from "../MatchEventsList";

export default function CommentaryTab({ matchData }: { matchData: MatchData }) {
  const [filter, setFilter] = useState<"all" | "boundaries" | "wickets">("all");
  const { meta, cricket, football } = matchData;

  if (meta.sport !== "cricket") {
    return (
      <div className="space-y-5 rounded-3xl border border-border bg-panel p-6 shadow-xl">
        <h3 className="flex items-center gap-2 border-b border-border pb-4 text-base font-bold text-fg">
          <Activity className="h-5 w-5 text-pitch-green" />
          <span>Match Commentary</span>
        </h3>
        <MatchEventsList events={football?.events || []} teamAName={meta.teamA} teamBName={meta.teamB} />
      </div>
    );
  }

  if (!cricket) return null;

  const currentInnings = cricket.currentInnings === 2 ? cricket.innings2 : cricket.innings1;
  const recentBalls = currentInnings?.recentBalls || [];

  const filteredCommentary = recentBalls
    .filter((ball: any) => {
      if (typeof ball === "string") {
        if (filter === "boundaries") return ball === "4" || ball === "6";
        if (filter === "wickets") return ball === "W";
        return true;
      }
      if (filter === "boundaries") return ball.runs >= 4;
      if (filter === "wickets") return ball.isWicket;
      return true;
    })
    .reverse();

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-panel p-6 shadow-xl">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-fg">
            <Activity className="h-5 w-5 text-electric" />
            <span>Live Ball-by-Ball Commentary</span>
          </h3>
          <p className="mt-1 text-xs text-fg-muted">সর্বশেষ বলগুলোর ধারাভাষ্য ও আপডেট</p>
        </div>

        <div className="flex w-full items-center gap-2 overflow-x-auto rounded-full border border-border bg-ink p-1 text-xs md:w-auto">
          {(["all", "boundaries", "wickets"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`min-h-[36px] whitespace-nowrap rounded-full px-4 py-1.5 font-bold transition-all ${
                filter === f ? "bg-electric text-white shadow-md shadow-electric/20" : "text-fg-muted hover:text-fg"
              }`}
            >
              {f === "all" ? "All Balls" : f === "boundaries" ? "Boundaries" : "Wickets"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filteredCommentary.length === 0 ? (
          <div className="p-8 text-center text-sm text-fg-faint">কোনো ডেটা পাওয়া যায়নি।</div>
        ) : (
          filteredCommentary.map((ball: any, idx: number) => {
            if (typeof ball === "string") {
              let bgStyle = "border-border bg-ink";
              let badgeStyle = "border border-border bg-panel-raised text-fg-muted";
              let text = `${ball} Runs scored`;

              if (ball === "W") {
                bgStyle = "border-crimson/30 bg-crimson/10";
                badgeStyle = "bg-crimson text-white";
                text = "WICKET! The batsman departs.";
              } else if (ball === "4" || ball === "6") {
                bgStyle = "border-electric/30 bg-electric/10";
                badgeStyle = "bg-electric text-white";
                text = ball === "4" ? "FOUR! Beautiful shot." : "SIX! Massive hit!";
              }

              return (
                <div key={idx} className={`rounded-2xl border p-4 text-sm transition-colors ${bgStyle}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-fg-muted">Recent Action</span>
                    <span className={`rounded-full px-2.5 py-0.5 font-broadcast text-xs font-bold ${badgeStyle}`}>
                      {ball === "W" ? "WICKET" : `${ball} RUNS`}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-fg-muted sm:text-sm">{text}</p>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="rounded-2xl border border-border bg-ink p-4 text-sm transition-colors hover:bg-panel-raised"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full border border-border bg-panel-raised px-2.5 py-0.5 font-mono text-xs font-bold text-electric">
                      Ov {ball.ballNumber}
                    </span>
                    <span className="font-semibold text-fg">
                      {ball.bowlerName} to {ball.batsmanName}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-broadcast text-xs font-bold ${
                      ball.isWicket
                        ? "bg-crimson text-white"
                        : ball.runs >= 4
                          ? "bg-electric text-white"
                          : "border border-border bg-panel-raised text-fg/80"
                    }`}
                  >
                    {ball.isWicket ? "WICKET" : `${ball.runs} RUNS`}
                  </span>
                </div>
                <p className="pl-1 text-xs leading-relaxed text-fg-muted sm:text-sm">{ball.text}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
