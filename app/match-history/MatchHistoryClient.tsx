"use client";

import { useState } from "react";
import { History, Trophy } from "lucide-react";
import MatchResultCard from "@/components/common/MatchResultCard";

interface Props {
  matches: any[];
}

export default function MatchHistoryClient({ matches }: Props) {
  const [filter, setFilter] = useState<"all" | "cricket" | "football">("all");

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true;
    const sport = match.sport || match.meta?.sport || "cricket";
    return sport === filter;
  });

  return (
    <div className="w-full min-w-0">
      {/* Header & Sport Filter Row */}
      <div className="mb-6 flex min-w-0 flex-col justify-between gap-4 border-b border-border pb-5 sm:mb-8 sm:gap-6 sm:pb-6 md:flex-row md:items-end">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-crimson">
            <History className="h-3.5 w-3.5" /> Permanent Archive
          </div>
          <h1 className="text-2xl font-black tracking-tight text-fg sm:text-4xl">Match Results & Scorecards</h1>
          <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-fg-muted sm:text-sm">
            Explore archives of all previously broadcasted matches. Click on any match to view the full detailed
            scoreboard, commentary, and playing XI.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex w-full sm:w-max shrink-0 items-center justify-between sm:justify-start rounded-full border border-border bg-panel p-1 text-xs shadow-sm">
          {(["all", "cricket", "football"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`min-h-[38px] flex-1 sm:flex-initial whitespace-nowrap rounded-full px-3.5 py-1.5 font-bold transition-all sm:min-h-[44px] sm:px-5 sm:py-2 ${
                filter === f ? "bg-electric text-white shadow-md shadow-electric/20" : "text-fg-muted hover:text-fg"
              }`}
            >
              {f === "all" ? `All (${matches.length})` : f === "cricket" ? "Cricket" : "Football"}
            </button>
          ))}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-border bg-panel p-8 text-center shadow-xl sm:rounded-3xl sm:p-16">
          <Trophy size={40} className="mx-auto mb-2 text-fg-faint" />
          <h3 className="text-lg font-bold text-fg sm:text-xl">No Matches Found</h3>
          <p className="text-xs text-fg-muted sm:text-sm">No matches match your selected filter.</p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match) => (
            <MatchResultCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
