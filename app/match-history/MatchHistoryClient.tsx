// app/match-history/MatchHistoryClient.tsx
"use client";

import { useState } from "react";
import { History, Trophy, Search } from "lucide-react";
import MatchResultCard from "@/components/common/MatchResultCard";
import { safeArray } from "@/lib/utils";

interface Props {
  matches: any[];
}

export default function MatchHistoryClient({ matches = [] }: Props) {
  const [filter, setFilter] = useState<"all" | "cricket" | "football">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const safeMatchesList = safeArray<any>(matches);

  const filteredMatches = safeMatchesList.filter((match: any) => {
    const sport = match?.sport || match?.meta?.sport || "cricket";
    if (filter !== "all" && sport !== filter) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    const teamA = (match?.teamA || match?.meta?.teamA || "").toLowerCase();
    const teamB = (match?.teamB || match?.meta?.teamB || "").toLowerCase();
    const tournament = (match?.tournament || match?.meta?.tournament || "").toLowerCase();
    const result = (match?.finalResult || "").toLowerCase();

    return teamA.includes(q) || teamB.includes(q) || tournament.includes(q) || result.includes(q);
  });

  return (
    <div className="w-full min-w-0">
      <div className="mb-6 flex min-w-0 flex-col justify-between gap-4 border-b border-border pb-5 sm:mb-8 sm:gap-6 sm:pb-6 md:flex-row md:items-end">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-crimson">
            <History className="h-3.5 w-3.5" /> Permanent Archive
          </div>
          <h1 className="text-2xl font-black tracking-tight text-fg sm:text-4xl">Match Results &amp; Scorecards</h1>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-fg-muted sm:text-sm">
            Explore archives of all previously broadcasted matches. Click on any match to view the full detailed
            scoreboard, commentary, and playing XI.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search match or team..."
              className="min-h-[38px] sm:min-h-[44px] w-full sm:w-56 rounded-full border border-border bg-panel pl-9 pr-3 text-xs text-fg outline-none focus:border-electric"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-start rounded-full border border-border bg-panel p-1 text-xs shadow-sm">
            {(["all", "cricket", "football"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`min-h-[34px] sm:min-h-[38px] flex-1 sm:flex-initial whitespace-nowrap rounded-full px-3.5 py-1 font-bold transition-all ${
                  filter === f ? "bg-electric text-white shadow-md shadow-electric/20" : "text-fg-muted hover:text-fg"
                }`}
              >
                {f === "all" ? `All (${safeMatchesList.length})` : f === "cricket" ? "Cricket" : "Football"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-border bg-panel p-8 text-center shadow-xl sm:rounded-3xl sm:p-16">
          <Trophy size={40} className="mx-auto mb-2 text-fg-faint" />
          <h3 className="text-lg font-bold text-fg sm:text-xl">No Matches Found</h3>
          <p className="text-xs text-fg-muted sm:text-sm">
            {searchQuery ? `"${searchQuery}" এর সাথে মিলে এমন কোনো ম্যাচ পাওয়া যায়নি।` : "No matches match your selected filter."}
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match: any) => (
            <MatchResultCard key={match?.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}