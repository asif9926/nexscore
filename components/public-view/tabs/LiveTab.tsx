"use client";

import { MatchData } from "@/lib/types/match";
import { Activity } from "lucide-react";
import MatchEventsList from "../MatchEventsList";

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

export default function LiveTab({ matchData }: { matchData: MatchData }) {
  const { meta, cricket, football } = matchData;

  // ১. ফুটবল ভিউ
  if (meta.sport !== "cricket") {
    const halfData = football?.currentHalf === 2 ? football?.half2 : football?.half1;
    const possession = halfData?.possession || { teamA: 50, teamB: 50 };

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-panel p-6 shadow-xl">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-fg-faint">
            <span className="flex items-center gap-2">
              <Activity size={14} className="text-pitch-green" /> Ball Possession
            </span>
            <span>{football?.currentHalf === 2 ? "2nd Half" : "1st Half"}</span>
          </div>
          <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-ink">
            <div className="h-full bg-pitch-green transition-all" style={{ width: `${possession.teamA}%` }} />
            <div className="h-full bg-electric transition-all" style={{ width: `${possession.teamB}%` }} />
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-pitch-green">
              {meta.teamA} — {possession.teamA}%
            </span>
            <span className="text-electric">
              {meta.teamB} — {possession.teamB}%
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-panel p-6 shadow-xl">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-fg">
            <Activity className="h-4 w-4 text-electric" />
            <span>Match Events</span>
          </h3>
          <MatchEventsList events={football?.events || []} teamAName={meta.teamA} teamBName={meta.teamB} />
        </div>
      </div>
    );
  }

  // ২. ক্রিকেট ভিউ
  if (!cricket) return null;

  const isSecondInnings = cricket.currentInnings === 2;
  const currentInnings = isSecondInnings ? cricket.innings2 : cricket.innings1;

  if (!currentInnings) return null;

  // টিম নাম ডায়নামিক বের করা
  const battingTeamKey = currentInnings.battingTeam;
  const battingTeamName = battingTeamKey === "teamA" ? meta.teamA : meta.teamB;
  const bowlingTeamName = battingTeamKey === "teamA" ? meta.teamB : meta.teamA;

  const striker = currentInnings.batsmen?.find((b) => b.onStrike && !b.isOut);
  const nonStriker = currentInnings.batsmen?.find((b) => !b.onStrike && !b.isOut);
  const activeBowler = currentInnings.bowlers?.find((b) => b.isActive);

  const totalOversDec = cricket.maxOvers || 20;
  const currentOversDec = oversToDecimal(currentInnings.overs);
  const crr = currentOversDec > 0 ? (currentInnings.score / currentOversDec).toFixed(2) : "0.00";

  const projectedScore = Math.round(currentInnings.score + Number(crr) * Math.max(0, totalOversDec - currentOversDec));

  const target = currentInnings.target;
  const runsNeeded = target ? target - currentInnings.score : null;
  const ballsRemaining = target
    ? totalOversDec * 6 - (Number(currentInnings.overs.split(".")[0]) * 6 + Number(currentInnings.overs.split(".")[1] || 0))
    : null;
  const rrr = runsNeeded && ballsRemaining && ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : null;

  return (
    <div className="space-y-4 sm:space-y-6 w-full min-w-0">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 min-w-0">
        
        {/* Batsmen & Bowler Cards */}
        <div className="space-y-3 rounded-2xl border border-border bg-panel p-4 shadow-xl sm:rounded-3xl sm:p-6 md:col-span-2 min-w-0">
          
          {/* Batsmen at Crease with Batting Team Name */}
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-fg truncate">
              <span className="text-base shrink-0">🏏</span> 
              <span className="truncate">Batsmen at Crease • <strong className="text-electric font-bold">{battingTeamName}</strong></span>
            </h3>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            {/* Striker */}
            <div className="flex items-center justify-between rounded-xl border border-signal-gold/40 bg-signal-gold/10 p-3 sm:rounded-2xl sm:p-4">
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <span className="animate-pulse text-lg font-black text-signal-gold shrink-0">*</span>
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-bold text-fg text-xs sm:text-sm truncate">{striker?.name || "Striker"}</span>
                    <span className="shrink-0 rounded bg-signal-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-signal-gold">
                      STRIKE
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-fg-muted mt-0.5">
                    {striker?.fours || 0} 4s • {striker?.sixes || 0} 6s
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-broadcast text-xl sm:text-3xl font-bold text-signal-gold leading-none">
                  {striker?.runs || 0} <span className="font-sans text-xs text-fg-muted font-normal">({striker?.balls || 0})</span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-fg-muted">SR: {calculateSR(striker?.runs || 0, striker?.balls || 0)}</div>
              </div>
            </div>

            {/* Non-Striker */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-3 sm:rounded-2xl sm:p-4">
              <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <span className="text-fg-faint shrink-0 ml-1">•</span>
                <div className="min-w-0 truncate">
                  <div className="font-bold text-fg text-xs sm:text-sm truncate">{nonStriker?.name || "Non-Striker"}</div>
                  <div className="text-[10px] sm:text-xs text-fg-muted mt-0.5">
                    {nonStriker?.fours || 0} 4s • {nonStriker?.sixes || 0} 6s
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-broadcast text-xl sm:text-2xl font-bold text-fg/90 leading-none">
                  {nonStriker?.runs || 0} <span className="font-sans text-xs text-fg-muted font-normal">({nonStriker?.balls || 0})</span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] text-fg-muted">SR: {calculateSR(nonStriker?.runs || 0, nonStriker?.balls || 0)}</div>
              </div>
            </div>
          </div>

          {/* Current Bowler with Bowling Team Name */}
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-ink/70 p-3 sm:rounded-2xl sm:p-4">
            <div className="min-w-0 flex-1 pr-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-fg-faint truncate">
                Current Bowler • <strong className="text-crimson font-bold">{bowlingTeamName}</strong>
              </div>
              <div className="truncate text-xs sm:text-base font-bold text-fg mt-0.5">{activeBowler?.name || "Bowler"}</div>
              <div className="text-[10px] text-fg-muted">Maidens: {activeBowler?.maidens || 0}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-broadcast text-xl sm:text-3xl font-bold text-crimson leading-none">
                {activeBowler?.wickets || 0}/{activeBowler?.runs || 0}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-fg-muted">
                {activeBowler?.overs || "0.0"} ov • Econ {calculateEcon(activeBowler?.runs || 0, activeBowler?.overs || "0.0")}
              </div>
            </div>
          </div>
        </div>

        {/* Match Equations with Dynamic Team Context */}
        <div className="space-y-3 rounded-2xl border border-border bg-panel p-4 shadow-xl sm:rounded-3xl sm:p-6 min-w-0">
          <h3 className="flex items-center gap-1.5 border-b border-border pb-2.5 text-xs sm:text-sm font-bold text-fg truncate">
            <Activity className="h-4 w-4 text-electric shrink-0" />
            <span className="truncate">Match Equations {isSecondInnings ? `• ${battingTeamName} Chasing` : `• 1st Innings`}</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-2.5 sm:p-3">
              <span className="text-fg-muted">Current Run Rate (CRR)</span>
              <strong className="font-mono text-xs sm:text-sm text-fg">{crr}</strong>
            </div>

            {isSecondInnings && target && (
              <>
                <div className="flex items-center justify-between rounded-xl border border-crimson/30 bg-crimson/10 p-2.5 sm:p-3">
                  <span className="text-crimson/90">Required Run Rate</span>
                  <strong className="font-mono text-xs sm:text-sm text-crimson">{rrr || "0.00"}</strong>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-2.5 sm:p-3">
                  <span className="text-fg-muted">Target ({bowlingTeamName})</span>
                  <strong className="font-mono text-xs sm:text-sm text-fg">{target}</strong>
                </div>
                <div className="rounded-xl border border-signal-gold/40 bg-signal-gold/10 p-2.5 text-center font-bold text-signal-gold text-[11px] sm:text-xs">
                  {battingTeamName} need {Math.max(0, runsNeeded || 0)} runs from {ballsRemaining} balls
                </div>
              </>
            )}

            {!isSecondInnings && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-2.5 sm:p-3">
                <span className="text-fg-muted">Projected Total ({battingTeamName})</span>
                <strong className="font-mono text-xs sm:text-sm text-electric">{projectedScore}</strong>
              </div>
            )}

            <div className="flex items-center justify-between rounded-xl border border-border bg-ink p-2.5 sm:p-3">
              <span className="text-fg-muted">Extras Conceded ({bowlingTeamName})</span>
              <strong className="font-mono text-xs sm:text-sm text-fg">
                {(currentInnings.extras?.wide || 0) +
                  (currentInnings.extras?.noBall || 0) +
                  (currentInnings.extras?.bye || 0) +
                  (currentInnings.extras?.legBye || 0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Action Timeline */}
      {currentInnings.recentBalls && currentInnings.recentBalls.length > 0 && (
        <div className="rounded-2xl border border-border bg-panel p-4 shadow-xl sm:rounded-3xl sm:p-6 min-w-0">
          <div className="mb-3 flex items-center justify-between text-[10px] sm:text-xs font-bold uppercase tracking-wider text-fg-faint">
            <span>Recent Action Timeline</span>
            <span className="rounded-full border border-electric/30 bg-electric/10 px-2 py-0.5 font-mono text-[9px] text-electric">
              Last 12 Deliveries
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x">
            {currentInnings.recentBalls.slice(-12).map((ballItem: any, idx: number) => {
              const label = typeof ballItem === "string" ? ballItem : ballItem.label;
              const tooltipText = typeof ballItem === "object" ? ballItem.text : undefined;

              let style = "border-border bg-ink text-fg-muted";
              if (label === "W") style = "bg-crimson border-crimson/60 text-white shadow-sm";
              else if (label === "6") style = "bg-signal-gold border-signal-gold/60 text-ink shadow-sm";
              else if (label === "4") style = "bg-electric border-electric/60 text-white shadow-sm";
              else if (label?.includes("Wd") || label?.includes("Nb") || label?.includes("lb") || label?.includes("b"))
                style = "bg-panel-raised border-fg-faint/40 text-fg";
              else if (label !== "0") style = "border-border bg-panel-raised text-fg/90";

              return (
                <div
                  key={idx}
                  title={tooltipText}
                  className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 snap-start items-center justify-center rounded-xl border font-broadcast text-sm sm:text-base font-bold ${style}`}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}