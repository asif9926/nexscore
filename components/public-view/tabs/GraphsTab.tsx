// components/public-view/tabs/GraphsTab.tsx
"use client";

import { useState } from "react";
import { MatchData } from "@/lib/types/match";
import { calculateCRR, safeArray } from "@/lib/utils";

export default function GraphsTab({ matchData }: { matchData: MatchData }) {
  const { meta, cricket, football } = matchData || {};

  // ১. ফুটবল ভিউ
  if (meta?.sport !== "cricket" || !cricket) {
    const half1 = football?.half1?.possession || { teamA: 50, teamB: 50 };
    const half2 = football?.half2?.possession || { teamA: 50, teamB: 50 };
    const currentHalfPossession = football?.currentHalf === 2 ? half2 : half1;

    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border bg-panel p-5 shadow-xl sm:rounded-3xl sm:p-6">
          <h3 className="border-b border-border pb-3 text-sm sm:text-base font-bold text-fg">
            Ball Possession Stats
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <div className="mb-1.5 flex justify-between text-fg-muted">
                <span className="text-pitch-green font-bold">{meta?.teamA}: {currentHalfPossession.teamA}%</span>
                <span className="text-electric font-bold">{meta?.teamB}: {currentHalfPossession.teamB}%</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-ink">
                <div className="h-full bg-pitch-green transition-all" style={{ width: `${currentHalfPossession.teamA}%` }} />
                <div className="h-full bg-electric transition-all" style={{ width: `${currentHalfPossession.teamB}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-border space-y-2 text-xs">
              <div className="flex justify-between text-fg-muted">
                <span>1st Half Possession</span>
                <span>{half1.teamA}% - {half1.teamB}%</span>
              </div>
              <div className="flex justify-between text-fg-muted">
                <span>2nd Half Possession</span>
                <span>{half2.teamA}% - {half2.teamB}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-panel p-5 shadow-xl sm:rounded-3xl sm:p-6">
          <h3 className="border-b border-border pb-3 text-sm sm:text-base font-bold text-fg">
            Team Comparison
          </h3>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-3">
              <span className="text-fg font-bold">{meta?.teamA} Total Goals</span>
              <span className="font-score text-lg text-electric">{football?.scoreA || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-3">
              <span className="text-fg font-bold">{meta?.teamB} Total Goals</span>
              <span className="font-score text-lg text-signal-gold">{football?.scoreB || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-3 text-fg-muted">
              <span>Total Cards Shown</span>
              <span>
                {(football?.yellowCardsA || 0) +
                  (football?.yellowCardsB || 0) +
                  (football?.redCardsA || 0) +
                  (football?.redCardsB || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ২. ক্রিকেট ভিউ
  const inn1 = cricket.innings1;
  const inn2 = cricket.innings2;
  const hasSecondInnings = Boolean(inn2 && ((inn2?.score || 0) > 0 || inn2?.overs !== "0.0" || cricket.currentInnings === 2));

  const [selectedInningsNum, setSelectedInningsNum] = useState<1 | 2>(cricket.currentInnings || 1);
  const displayedInnings = selectedInningsNum === 2 && hasSecondInnings ? inn2 : inn1;

  if (!displayedInnings) return null;

  const totalRuns: number = Math.max(displayedInnings.score || 1, 1);
  const batsmen = safeArray<any>(displayedInnings.batsmen);

  // 🛡️ ফিক্সড: sum: number এক্সপ্লিসিট টাইপ
  const foursRuns: number = batsmen.reduce((sum: number, b: any) => sum + (Number(b?.fours) || 0) * 4, 0);
  const sixesRuns: number = batsmen.reduce((sum: number, b: any) => sum + (Number(b?.sixes) || 0) * 6, 0);
  const extrasRuns: number =
    (displayedInnings.extras?.wide || 0) +
    (displayedInnings.extras?.noBall || 0) +
    (displayedInnings.extras?.bye || 0) +
    (displayedInnings.extras?.legBye || 0);
  const singlesAndDoubles: number = Math.max(0, (displayedInnings.score || 0) - foursRuns - sixesRuns - extrasRuns);

  const inn1CRR = calculateCRR(inn1?.score || 0, inn1?.overs || "0.0");
  const inn2CRR = calculateCRR(inn2?.score || 0, inn2?.overs || "0.0");

  const battingTeamName = displayedInnings.battingTeam === "teamA" ? meta.teamA : meta.teamB;

  return (
    <div className="space-y-6">
      {hasSecondInnings && (
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <button
            type="button"
            onClick={() => setSelectedInningsNum(1)}
            className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              selectedInningsNum === 1
                ? "bg-electric text-white shadow-md shadow-electric/20"
                : "border border-border bg-panel text-fg-muted hover:text-fg"
            }`}
          >
            1st Innings Chart
          </button>
          <button
            type="button"
            onClick={() => setSelectedInningsNum(2)}
            className={`min-h-[38px] rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              selectedInningsNum === 2
                ? "bg-signal-gold text-ink shadow-md shadow-signal-gold/20"
                : "border border-border bg-panel text-fg-muted hover:text-fg"
            }`}
          >
            2nd Innings Chart
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-3xl border border-border bg-panel p-6 shadow-xl">
          <div className="border-b border-border pb-3 flex justify-between items-center">
            <h3 className="text-sm sm:text-base font-bold text-fg">Scoring Breakdown (% Runs)</h3>
            <span className="text-xs font-bold text-electric">{battingTeamName}</span>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <div className="mb-1.5 flex justify-between text-fg-muted">
                <span>Boundaries (4s): {foursRuns} runs</span>
                <span className="font-mono font-bold text-fg">{Math.round((foursRuns / totalRuns) * 100)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink">
                <div className="h-full rounded-full bg-electric transition-all duration-700" style={{ width: `${(foursRuns / totalRuns) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-fg-muted">
                <span>Maximums (6s): {sixesRuns} runs</span>
                <span className="font-mono font-bold text-fg">{Math.round((sixesRuns / totalRuns) * 100)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink">
                <div className="h-full rounded-full bg-signal-gold transition-all duration-700" style={{ width: `${(sixesRuns / totalRuns) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-fg-muted">
                <span>Running Between Wickets: {singlesAndDoubles} runs</span>
                <span className="font-mono font-bold text-fg">{Math.round((singlesAndDoubles / totalRuns) * 100)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink">
                <div className="h-full rounded-full bg-pitch-green transition-all duration-700" style={{ width: `${(singlesAndDoubles / totalRuns) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-fg-muted">
                <span>Extras: {extrasRuns} runs</span>
                <span className="font-mono font-bold text-fg">{Math.round((extrasRuns / totalRuns) * 100)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-ink">
                <div className="h-full rounded-full bg-crimson transition-all duration-700" style={{ width: `${(extrasRuns / totalRuns) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-border bg-panel p-6 shadow-xl">
          <h3 className="border-b border-border pb-3 text-sm sm:text-base font-bold text-fg">Innings Comparison</h3>

          <div className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1.5 rounded-2xl border border-electric/30 bg-electric/10 p-4">
              <div className="font-bold text-fg">
                {inn1?.battingTeam === "teamA" ? meta.teamA : meta.teamB} <span className="text-fg-muted font-normal">(1st Innings)</span>
              </div>
              <div className="font-broadcast text-xl font-bold text-electric">
                {inn1?.score || 0}/{inn1?.wickets || 0} <span className="font-sans text-xs text-fg-muted">in {inn1?.overs || "0.0"} ov</span>
              </div>
              <div className="text-fg-muted">Run Rate: <strong className="text-fg font-mono">{inn1CRR}</strong> rpo</div>
            </div>

            {hasSecondInnings && (
              <div className="space-y-1.5 rounded-2xl border border-signal-gold/30 bg-signal-gold/10 p-4">
                <div className="font-bold text-fg">
                  {inn2?.battingTeam === "teamA" ? meta.teamA : meta.teamB} <span className="text-fg-muted font-normal">(2nd Innings)</span>
                </div>
                <div className="font-broadcast text-xl font-bold text-signal-gold">
                  {inn2?.score || 0}/{inn2?.wickets || 0} <span className="font-sans text-xs text-fg-muted">in {inn2?.overs || "0.0"} ov</span>
                </div>
                <div className="text-fg-muted flex justify-between">
                  <span>Current RR: <strong className="text-fg font-mono">{inn2CRR}</strong></span>
                  {inn2?.target && <span className="text-signal-gold font-bold">Target: {inn2.target}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}