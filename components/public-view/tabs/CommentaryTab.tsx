"use client";

import { useState } from "react";
import { MatchData } from "@/lib/types/match";
import { Activity } from "lucide-react";
import MatchEventsList from "../MatchEventsList";

export default function CommentaryTab({ matchData }: { matchData: MatchData }) {
  const [filter, setFilter] = useState<"all" | "boundaries" | "wickets">("all");
  const { meta, cricket, football } = matchData;

  // 🛡️ ইনিংস সুইচিং স্টেট (২য় ইনিংসে গেলেও ১ম ইনিংসের কমেন্টারি দেখার সুবিধা)
  const [activeInningsTab, setActiveInningsTab] = useState<1 | 2>(
    cricket?.currentInnings || 1
  );

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

  const selectedInnings = activeInningsTab === 2 ? cricket.innings2 : cricket.innings1;
  const recentBalls = selectedInnings?.recentBalls || [];

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
    .slice()
    .reverse();

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-panel p-6 shadow-xl">
      {/* Top Header & Filters */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-4 md:flex-row md:items-center">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-fg">
            <Activity className="h-5 w-5 text-electric" />
            <span>Live Ball-by-Ball Commentary</span>
          </h3>
          <p className="mt-1 text-xs text-fg-muted">সর্বশেষ বলগুলোর ধারাভাষ্য ও লাইভ আপডেট</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Innings Switcher (২য় ইনিংস চালু হলে বা শেষ হলে দৃশ্যমান হবে) */}
          {cricket.currentInnings === 2 && (
            <div className="flex rounded-full border border-border bg-ink p-1 text-xs">
              <button
                onClick={() => setActiveInningsTab(1)}
                className={`rounded-full px-3 py-1 font-bold transition-all ${
                  activeInningsTab === 1 ? "bg-panel-raised text-electric" : "text-fg-muted hover:text-fg"
                }`}
              >
                1st Inn
              </button>
              <button
                onClick={() => setActiveInningsTab(2)}
                className={`rounded-full px-3 py-1 font-bold transition-all ${
                  activeInningsTab === 2 ? "bg-electric text-white" : "text-fg-muted hover:text-fg"
                }`}
              >
                2nd Inn
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

      {/* Commentary Timeline List */}
      <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filteredCommentary.length === 0 ? (
          <div className="p-8 text-center text-sm text-fg-faint">কোনো বলের ধারাভাষ্য পাওয়া যায়নি।</div>
        ) : (
          filteredCommentary.map((ball: any, idx: number) => {
            // সেফ ইউনিক কি (রি-রেন্ডার অপ্টিমাইজেশন)
            const itemKey = ball.timestamp || `${ball.ballNumber || idx}-${idx}`;

            // Legacy Fallback (স্ট্রিং ফরম্যাটের জন্য)
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
                <div key={itemKey} className={`rounded-2xl border p-4 text-sm transition-colors ${bgStyle}`}>
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

            // Real-time Object View (commentaryGenerator Output)
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
                {/* মিসিং টেক্সটের জন্য অটোমেটিক ফলব্যাক */}
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