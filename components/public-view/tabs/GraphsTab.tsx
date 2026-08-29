"use client";

import { MatchData } from "@/lib/types/match";
import { TrendingUp } from "lucide-react";

export default function GraphsTab({ matchData }: { matchData: MatchData }) {
  const { meta, cricket, football } = matchData;

  if (meta.sport !== "cricket" || !cricket) {
    const half1 = football?.half1?.possession || { teamA: 50, teamB: 50 };
    const half2 = football?.half2?.possession || { teamA: 50, teamB: 50 };
    const currentHalfPossession = football?.currentHalf === 2 ? half2 : half1;

    return (
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        {/* Ball Possession Graph */}
        <div className="space-y-4 rounded-2xl border border-border bg-panel p-5 shadow-xl sm:rounded-3xl sm:p-6">
          <h3 className="border-b border-border pb-3 text-sm sm:text-base font-bold text-fg">
            Ball Possession Stats
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Current Half */}
            <div>
              <div className="mb-1.5 flex justify-between text-fg-muted">
                <span className="text-pitch-green font-bold">{meta.teamA}: {currentHalfPossession.teamA}%</span>
                <span className="text-electric font-bold">{meta.teamB}: {currentHalfPossession.teamB}%</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-ink">
                <div className="h-full bg-pitch-green transition-all" style={{ width: `${currentHalfPossession.teamA}%` }} />
                <div className="h-full bg-electric transition-all" style={{ width: `${currentHalfPossession.teamB}%` }} />
              </div>
            </div>

            {/* 1st vs 2nd Half Comparison */}
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

        {/* Goal & Discipline Distribution */}
        <div className="space-y-4 rounded-2xl border border-border bg-panel p-5 shadow-xl sm:rounded-3xl sm:p-6">
          <h3 className="border-b border-border pb-3 text-sm sm:text-base font-bold text-fg">
            Team Comparison
          </h3>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-3">
              <span className="text-fg font-bold">{meta.teamA} Total Goals</span>
              <span className="font-score text-lg text-electric">{football?.scoreA || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-3">
              <span className="text-fg font-bold">{meta.teamB} Total Goals</span>
              <span className="font-score text-lg text-signal-gold">{football?.scoreB || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-3 text-fg-muted">
              <span>Total Cards Shown</span>
              <span>{(football?.yellowCardsA || 0) + (football?.yellowCardsB || 0) + (football?.redCardsA || 0) + (football?.redCardsB || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inn1 = cricket.innings1;
  const inn2 = cricket.innings2;
  const isSecondInnings = cricket.currentInnings === 2;
  const displayedInnings = isSecondInnings ? inn2 : inn1;

  if (!displayedInnings) return null;

  const totalRuns = Math.max(displayedInnings.score || 1, 1);
  const foursRuns = displayedInnings.batsmen?.reduce((sum, b) => sum + (b.fours || 0) * 4, 0) || 0;
  const sixesRuns = displayedInnings.batsmen?.reduce((sum, b) => sum + (b.sixes || 0) * 6, 0) || 0;
  const extrasRuns =
    (displayedInnings.extras?.wide || 0) +
    (displayedInnings.extras?.noBall || 0) +
    (displayedInnings.extras?.bye || 0) +
    (displayedInnings.extras?.legBye || 0);
  const singlesAndDoubles = Math.max(0, (displayedInnings.score || 0) - foursRuns - sixesRuns - extrasRuns);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-4 rounded-3xl border border-border bg-panel p-6 shadow-xl">
        <h3 className="border-b border-border pb-3 text-base font-bold text-fg">Scoring Breakdown (% Runs)</h3>

        <div className="space-y-4 text-xs sm:text-sm">
          <div>
            <div className="mb-1.5 flex justify-between text-fg-muted">
              <span>Fours (4s): {foursRuns} runs</span>
              <span>{Math.round((foursRuns / totalRuns) * 100)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink">
              <div className="h-full rounded-full bg-electric transition-all duration-1000" style={{ width: `${(foursRuns / totalRuns) * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-fg-muted">
              <span>Sixes (6s): {sixesRuns} runs</span>
              <span>{Math.round((sixesRuns / totalRuns) * 100)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink">
              <div className="h-full rounded-full bg-signal-gold transition-all duration-1000" style={{ width: `${(sixesRuns / totalRuns) * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-fg-muted">
              <span>Singles & Running: {singlesAndDoubles} runs</span>
              <span>{Math.round((singlesAndDoubles / totalRuns) * 100)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink">
              <div
                className="h-full rounded-full bg-pitch-green transition-all duration-1000"
                style={{ width: `${(singlesAndDoubles / totalRuns) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex justify-between text-fg-muted">
              <span>Extras: {extrasRuns} runs</span>
              <span>{Math.round((extrasRuns / totalRuns) * 100)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink">
              <div className="h-full rounded-full bg-crimson transition-all duration-1000" style={{ width: `${(extrasRuns / totalRuns) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-3xl border border-border bg-panel p-6 shadow-xl">
        <h3 className="border-b border-border pb-3 text-base font-bold text-fg">Innings Run Rate Comparison</h3>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5 rounded-2xl border border-electric/30 bg-electric/10 p-4 transition-colors hover:bg-electric/15">
            <div className="font-bold text-fg">
              {inn1?.battingTeam === "teamA" ? meta.teamA : meta.teamB}{" "}
              <span className="ml-1 font-normal text-fg-muted">(1st Innings)</span>
            </div>
            <div className="font-broadcast text-xl font-bold text-electric">
              {inn1?.score || 0}/{inn1?.wickets || 0} <span className="font-sans text-sm text-fg-muted">in {inn1?.overs || "0.0"} ov</span>
            </div>
            <div className="text-fg-muted">Run Rate: {inn1?.runRate || "0.00"} rpo</div>
          </div>

          {isSecondInnings && inn2 && (
            <div className="space-y-1.5 rounded-2xl border border-signal-gold/30 bg-signal-gold/10 p-4 transition-colors hover:bg-signal-gold/15">
              <div className="font-bold text-fg">
                {inn2?.battingTeam === "teamA" ? meta.teamA : meta.teamB}{" "}
                <span className="ml-1 font-normal text-fg-muted">(2nd Innings)</span>
              </div>
              <div className="font-broadcast text-xl font-bold text-signal-gold">
                {inn2?.score || 0}/{inn2?.wickets || 0} <span className="font-sans text-sm text-fg-muted">in {inn2?.overs || "0.0"} ov</span>
              </div>
              <div className="text-fg-muted">
                Current RR: {inn2?.runRate || "0.00"} <span className="ml-2 font-medium text-signal-gold">• Target: {inn2?.target}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
