"use client";

import { MatchData } from "@/lib/types/match";

export default function SquadsTab({ matchData }: { matchData: MatchData }) {
  const { meta, cricket, football } = matchData;
  const isCricket = meta.sport === "cricket";

  const squadA = isCricket ? cricket?.squads?.teamA : football?.squads?.teamA;
  const squadB = isCricket ? cricket?.squads?.teamB : football?.squads?.teamB;

  const renderSquad = (squad: any[], teamName: string, accent: "electric" | "signal-gold", emoji: string) => (
    <div className="space-y-4 rounded-3xl border border-border bg-panel p-6 shadow-xl">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <span className="text-2xl">{emoji}</span>
        <div>
          <h3 className={`text-base font-bold ${accent === "electric" ? "text-electric" : "text-signal-gold"}`}>{teamName}</h3>
          <span className="text-xs text-fg-muted">Playing XI Lineup</span>
        </div>
      </div>

      <div className="max-h-[500px] space-y-2 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {squad && squad.length > 0 ? (
          squad.map((player: any, idx: number) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-ink p-3 text-xs transition-colors hover:bg-panel-raised"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 font-mono text-fg-faint">{idx + 1}.</span>
                <span className="font-bold text-fg">{player.name}</span>
                {player.isCaptain && (
                  <span className="rounded border border-signal-gold/30 bg-signal-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-signal-gold shadow-sm">
                    C
                  </span>
                )}
                {player.isWicketKeeper && (
                  <span className="rounded border border-electric/30 bg-electric/15 px-1.5 py-0.5 text-[10px] font-bold text-electric shadow-sm">
                    WK
                  </span>
                )}
              </div>
              <span className="capitalize text-fg-muted">{player.role || "Player"}</span>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-sm text-fg-faint">স্কোয়াড এখনো যোগ করা হয়নি</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {renderSquad(squadA || [], meta.teamA, "electric", isCricket ? "🏏" : "👑")}
      {renderSquad(squadB || [], meta.teamB, "signal-gold", isCricket ? "⚡" : "🔴")}
    </div>
  );
}
