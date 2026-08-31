"use client";

import { useState } from "react";
import { MatchData, Batsman, Bowler, FallOfWicket } from "@/lib/types/match";
import { FileText, Trophy, Target } from "lucide-react";
import { safeArray } from "@/lib/utils";

const oversToDecimal = (oversStr?: string) => {
  if (!oversStr) return 0;
  const [o, b] = oversStr.split(".").map(Number);
  return (o || 0) + (b || 0) / 6;
};

const calculateSR = (runs: number, balls: number) => (balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0");

const calculateEcon = (runs: number, oversStr: string) => {
  const overs = oversToDecimal(oversStr);
  return overs > 0 ? (runs / overs).toFixed(2) : "0.00";
};

export default function ScorecardTab({ matchData }: { matchData: MatchData }) {
  const { meta, cricket, football } = matchData;

  // components/public-view/tabs/ScorecardTab.tsx-এর ফুটবল অংশে নিচের কোড ব্লকটি ব্যবহার করুন:

if (meta.sport !== "cricket" || !cricket) {
  const half1 = football?.half1 || { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } };
  const half2 = football?.half2 || { goalsA: 0, goalsB: 0, possession: { teamA: 50, teamB: 50 } };
  const allEvents = football?.events || [];

  const goalsTeamA = allEvents.filter((ev: any) => ev.type === "goal" && ev.team === "teamA");
  const goalsTeamB = allEvents.filter((ev: any) => ev.type === "goal" && ev.team === "teamB");

  return (
    <div className="space-y-5">
      {/* ⚽ Goal Scorers & Assists Card (FotMob / Premier League Style) */}
      <div className="rounded-2xl border border-border bg-panel p-5 shadow-xl sm:rounded-3xl sm:p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm sm:text-base font-bold text-fg border-b border-border pb-3">
          <Trophy size={16} className="text-pitch-green" />
          <span>Goal Scorers &amp; Assists</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team A Goals */}
          <div className="rounded-xl border border-border bg-ink p-4 space-y-2.5">
            <div className="font-bold text-electric text-xs uppercase tracking-wider flex justify-between">
              <span>{meta.teamA}</span>
              <span>{goalsTeamA.length} Goals</span>
            </div>
            {goalsTeamA.length === 0 ? (
              <p className="text-xs text-fg-faint italic">No goals scored yet</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {goalsTeamA.map((g: any) => (
                  <li key={g.id} className="flex items-center justify-between text-fg">
                    <span className="font-semibold">⚽ {g.scorerName}</span>
                    <span className="text-fg-muted font-mono">
                      {g.minute}' {g.assistName ? `(ast: ${g.assistName})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Team B Goals */}
          <div className="rounded-xl border border-border bg-ink p-4 space-y-2.5">
            <div className="font-bold text-signal-gold text-xs uppercase tracking-wider flex justify-between">
              <span>{meta.teamB}</span>
              <span>{goalsTeamB.length} Goals</span>
            </div>
            {goalsTeamB.length === 0 ? (
              <p className="text-xs text-fg-faint italic">No goals scored yet</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {goalsTeamB.map((g: any) => (
                  <li key={g.id} className="flex items-center justify-between text-fg">
                    <span className="font-semibold">⚽ {g.scorerName}</span>
                    <span className="text-fg-muted font-mono">
                      {g.minute}' {g.assistName ? `(ast: ${g.assistName})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Match Summary & Half Breakdown */}
      <div className="rounded-2xl border border-border bg-panel p-5 shadow-xl sm:rounded-3xl sm:p-6">
        <h3 className="mb-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-fg-muted border-b border-border pb-3">
          Half Breakdown &amp; Possession
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="rounded-xl border border-border bg-ink p-4 space-y-2">
            <div className="flex justify-between font-bold text-pitch-green text-xs uppercase tracking-wider">
              <span>1st Half</span>
              <span>Possession: {half1.possession.teamA}% - {half1.possession.teamB}%</span>
            </div>
            <div className="flex justify-between items-center text-fg font-semibold pt-1">
              <span>{meta.teamA}</span>
              <span className="font-score text-lg text-electric">{half1.goalsA}</span>
            </div>
            <div className="flex justify-between items-center text-fg font-semibold">
              <span>{meta.teamB}</span>
              <span className="font-score text-lg text-signal-gold">{half1.goalsB}</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-ink p-4 space-y-2">
            <div className="flex justify-between font-bold text-electric text-xs uppercase tracking-wider">
              <span>2nd Half</span>
              <span>Possession: {half2.possession.teamA}% - {half2.possession.teamB}%</span>
            </div>
            <div className="flex justify-between items-center text-fg font-semibold pt-1">
              <span>{meta.teamA}</span>
              <span className="font-score text-lg text-electric">{half2.goalsA}</span>
            </div>
            <div className="flex justify-between items-center text-fg font-semibold">
              <span>{meta.teamB}</span>
              <span className="font-score text-lg text-signal-gold">{half2.goalsB}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disciplinary Summary */}
      <div className="rounded-2xl border border-border bg-panel p-5 shadow-xl sm:rounded-3xl sm:p-6">
        <h3 className="mb-3 text-xs sm:text-sm font-bold uppercase tracking-wider text-fg-muted">
          Disciplinary Summary
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-border bg-ink p-3 text-center space-y-1">
            <div className="font-bold text-fg">{meta.teamA}</div>
            <div className="text-fg-muted">
              🟨 Yellow: <strong className="text-signal-gold">{football?.yellowCardsA || 0}</strong> • 🟥 Red: <strong className="text-crimson">{football?.redCardsA || 0}</strong>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-ink p-3 text-center space-y-1">
            <div className="font-bold text-fg">{meta.teamB}</div>
            <div className="text-fg-muted">
              🟨 Yellow: <strong className="text-signal-gold">{football?.yellowCardsB || 0}</strong> • 🟥 Red: <strong className="text-crimson">{football?.redCardsB || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  const [activeInningsTab, setActiveInningsTab] = useState<1 | 2>(cricket.currentInnings || 1);

  const inn1 = cricket.innings1;
  const inn2 = cricket.innings2;
  const displayedInnings = activeInningsTab === 1 ? inn1 : inn2;

  const battingTeamName = displayedInnings?.battingTeam === "teamA" ? meta.teamA : meta.teamB;
  const bowlingTeamName = displayedInnings?.battingTeam === "teamA" ? meta.teamB : meta.teamA;

  if (!displayedInnings) return null;

  const batsmenList = safeArray<Batsman>(displayedInnings.batsmen);
  const bowlersList = safeArray<Bowler>(displayedInnings.bowlers);
  const fowList = safeArray<FallOfWicket>(displayedInnings.fallOfWickets);

  return (
    <div className="space-y-6">
      {/* 1st & 2nd Innings Tabs */}
      <div className="flex items-center justify-center gap-3 border-b border-border pb-4 sm:justify-start">
        <button
          onClick={() => setActiveInningsTab(1)}
          className={`min-h-[44px] rounded-full px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
            activeInningsTab === 1
              ? "bg-electric text-white shadow-lg shadow-electric/20"
              : "border border-border bg-panel text-fg-muted hover:text-fg"
          }`}
        >
          1st Inn: {inn1?.score || 0}/{inn1?.wickets || 0}
        </button>

        <button
          onClick={() => setActiveInningsTab(2)}
          disabled={!inn2}
          className={`min-h-[44px] rounded-full px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
            activeInningsTab === 2
              ? "bg-electric text-white shadow-lg shadow-electric/20"
              : "border border-border bg-panel text-fg-muted hover:text-fg"
          } ${!inn2 ? "cursor-not-allowed opacity-50" : ""}`}
        >
          2nd Inn: {inn2 ? `${inn2.score}/${inn2.wickets}` : "Yet to bat"}
        </button>
      </div>

      {/* Batting Card */}
      <div className="overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-panel-raised/60 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-fg sm:text-base">
            <FileText size={16} className="text-electric" />
            <span>Batting • {battingTeamName}</span>
          </h3>
          <span className="font-mono text-xs font-bold text-electric">
            {displayedInnings.score}/{displayedInnings.wickets} ({displayedInnings.overs} Ov)
          </span>
        </div>

        {/* Mobile View (< sm) */}
        <div className="divide-y divide-border sm:hidden">
          {batsmenList.length === 0 ? (
            <div className="py-6 text-center text-xs text-fg-faint">কোনো ব্যাটারের ডেটা নেই</div>
          ) : (
            batsmenList.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3.5 transition-colors hover:bg-panel-raised/30">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 font-bold text-fg text-sm">
                    <span className="truncate">{b.name}</span>
                    {!b.isOut && (
                      <span className="shrink-0 rounded-full border border-electric/30 bg-electric/15 px-2 py-0.5 text-[9px] uppercase font-bold text-electric">
                        NOT OUT
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-fg-muted">
                    {b.isOut ? b.dismissal || "Out" : "Batting"}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <span className="font-broadcast text-lg font-bold text-electric block leading-none">{b.runs}</span>
                    <span className="text-[10px] text-fg-faint block mt-0.5">({b.balls}b)</span>
                  </div>
                  <div className="border-l border-border/80 pl-2.5 text-[10px] text-fg-muted leading-tight">
                    <div>4s: <strong className="text-fg">{b.fours}</strong></div>
                    <div>6s: <strong className="text-fg">{b.sixes}</strong></div>
                    <div>SR: <strong className="text-fg">{calculateSR(b.runs, b.balls)}</strong></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= sm) */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full whitespace-nowrap text-left text-xs sm:text-sm">
            <thead className="bg-panel-raised/40 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="w-1/3 p-3.5 pl-6">Batter</th>
                <th className="w-1/4 p-3.5">Status</th>
                <th className="p-3.5 text-right text-fg">R</th>
                <th className="p-3.5 text-right">B</th>
                <th className="p-3.5 text-right">4s</th>
                <th className="p-3.5 text-right">6s</th>
                <th className="p-3.5 pr-6 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batsmenList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-fg-faint">
                    কোনো ব্যাটারের ডেটা নেই
                  </td>
                </tr>
              ) : (
                batsmenList.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-panel-raised/40">
                    <td className="p-3.5 pl-6 font-bold text-fg">
                      <div className="flex items-center gap-2">
                        <span>{b.name}</span>
                        {!b.isOut && (
                          <span className="rounded-full border border-electric/30 bg-electric/15 px-2 py-0.5 text-[9px] uppercase font-bold text-electric">
                            NOT OUT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-fg-muted">{b.isOut ? b.dismissal || "Out" : "Batting"}</td>
                    <td className="p-3.5 text-right font-broadcast text-base font-bold text-electric">{b.runs}</td>
                    <td className="p-3.5 text-right font-mono text-fg-muted">{b.balls}</td>
                    <td className="p-3.5 text-right font-mono text-fg-muted">{b.fours}</td>
                    <td className="p-3.5 text-right font-mono text-fg-muted">{b.sixes}</td>
                    <td className="p-3.5 pr-6 text-right font-mono text-fg-muted">{calculateSR(b.runs, b.balls)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Extras & Total */}
        <div className="space-y-2 border-t border-border bg-panel-raised/40 p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-fg-muted">Extras</span>
            <span className="font-mono text-fg">
              <strong className="text-fg">
                {(displayedInnings.extras?.wide || 0) +
                  (displayedInnings.extras?.noBall || 0) +
                  (displayedInnings.extras?.bye || 0) +
                  (displayedInnings.extras?.legBye || 0)}
              </strong>{" "}
              (w {displayedInnings.extras?.wide || 0}, nb {displayedInnings.extras?.noBall || 0}, b{" "}
              {displayedInnings.extras?.bye || 0}, lb {displayedInnings.extras?.legBye || 0})
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-bold">
            <span className="text-fg">Total</span>
            <span className="font-broadcast text-base text-electric">
              {displayedInnings.score}/{displayedInnings.wickets}{" "}
              <span className="font-sans text-xs text-fg-muted">({displayedInnings.overs} Ov)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bowling Card with Bowling Team Name */}
      <div className="overflow-hidden rounded-3xl border border-border bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-border bg-panel-raised/60 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-fg sm:text-base">
            <Target size={16} className="text-crimson" />
            <span>Bowling • {bowlingTeamName}</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-xs sm:text-sm">
            <thead className="bg-panel-raised/40 text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
              <tr>
                <th className="p-3.5 pl-6">Bowler</th>
                <th className="p-3.5 text-right">O</th>
                <th className="p-3.5 text-right">M</th>
                <th className="p-3.5 text-right">R</th>
                <th className="p-3.5 text-right text-fg">W</th>
                <th className="p-3.5 pr-6 text-right">Econ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bowlersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-fg-faint">
                    কোনো বোলারের ডেটা নেই
                  </td>
                </tr>
              ) : (
                bowlersList.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-panel-raised/40">
                    <td className="flex items-center gap-2 p-3.5 pl-6 font-bold text-fg">
                      {b.name}
                      {b.isActive && (
                        <span className="rounded-full border border-crimson/30 bg-crimson/15 px-2 py-0.5 text-[9px] uppercase text-crimson">
                          Bowling
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono text-fg-muted">{b.overs}</td>
                    <td className="p-3.5 text-right font-mono text-fg-muted">{b.maidens}</td>
                    <td className="p-3.5 text-right font-mono text-fg-muted">{b.runs}</td>
                    <td className="p-3.5 text-right font-broadcast text-base font-bold text-crimson">{b.wickets}</td>
                    <td className="p-3.5 pr-6 text-right font-mono text-fg-muted">{calculateEcon(b.runs, b.overs)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {fowList.length > 0 && (
        <div className="rounded-3xl border border-border bg-panel p-6 shadow-xl">
          <h3 className="mb-4 text-sm font-bold text-fg">Fall of Wickets</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {fowList.map((fow, idx) => (
              <div
                key={idx}
                className="space-y-1 rounded-2xl border border-border bg-ink p-3.5 text-xs transition-colors hover:bg-panel-raised"
              >
                <div className="font-broadcast text-base font-bold text-crimson">
                  {fow.score}/{fow.wicketNumber} <span className="font-sans text-xs text-fg-muted">({fow.overs} ov)</span>
                </div>
                <div className="truncate font-medium text-fg/90">{fow.batsmanName}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}