"use client";

import Link from "next/link";
import { Trophy, Calendar, Eye, MapPin, Square } from "lucide-react";

interface Props {
  match: any;
}

export default function MatchResultCard({ match }: Props) {
  const sport = match.sport || match.meta?.sport || match.fullSnapshot?.meta?.sport || "cricket";
  const isCricket = sport === "cricket";

  const teamA = match.teamA || match.meta?.teamA || match.fullSnapshot?.meta?.teamA || "Team A";
  const teamB = match.teamB || match.meta?.teamB || match.fullSnapshot?.meta?.teamB || "Team B";

  // টুর্নামেন্ট নাম: যদি অ্যাডমিন দিয়ে থাকে তবে সেটাই দেখাবে, না দিলে fallback "Local Tournament"
  const rawTournament = match.tournament || match.meta?.tournament || match.fullSnapshot?.meta?.tournament;
  const tournament = rawTournament && rawTournament.trim() !== "" ? rawTournament.trim() : "Local Tournament";

  const rawVenue = match.venue || match.meta?.venue || match.fullSnapshot?.meta?.venue;
  const venue = rawVenue && rawVenue.trim() !== "" ? rawVenue.trim() : null;

  const dateStr = new Date(match.completedAt || Date.now()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const cricketSnap = match.cricket || match.fullSnapshot?.cricket;
  const footballSnap = match.football || match.fullSnapshot?.football;

  const inn1 = cricketSnap?.innings1;
  const inn2 = cricketSnap?.innings2;

  const inn1Team = inn1?.battingTeam === "teamA" ? teamA : teamB;
  const inn2Team = inn1?.battingTeam === "teamA" ? teamB : teamA;

  // ডায়নামিক রেজাল্ট ক্যালকুলেশন (যদি ডাটাবেজে আগে থেকে না থাকে)
  const getResultText = () => {
    if (match.finalResult && match.finalResult !== "Match Completed") {
      return match.finalResult;
    }

    if (isCricket && cricketSnap) {
      const targetScore = (inn1?.score || 0) + 1;
      if (inn2) {
        if (inn2.score >= targetScore) {
          const wkts = 10 - (inn2.wickets || 0);
          return `${inn2Team} won by ${wkts} wicket${wkts > 1 ? "s" : ""}`;
        }
        const diff = (inn1?.score || 0) - inn2.score;
        if (diff > 0) {
          return `${inn1Team} won by ${diff} run${diff > 1 ? "s" : ""}`;
        }
        if (diff === 0) {
          return "Match Tied (Super Over)";
        }
      }
      return "Match Completed";
    }

    if (!isCricket && footballSnap) {
      const scA = footballSnap.scoreA || 0;
      const scB = footballSnap.scoreB || 0;
      if (scA > scB) return `${teamA} won the match`;
      if (scB > scA) return `${teamB} won the match`;
      return "Match Draw";
    }

    return "Match Completed";
  };

  const finalResult = getResultText();

  return (
    <div className="group flex min-w-0 flex-col justify-between space-y-3.5 rounded-2xl border border-border bg-panel p-4 shadow-xl transition-all hover:border-electric/40 sm:rounded-3xl sm:p-5">
      <div className="min-w-0">
        {/* Top Header: Tournament Name & Date */}
        <div className="mb-3.5 flex min-w-0 items-center justify-between gap-2 text-xs text-fg-muted">
          <span className="min-w-0 truncate rounded-full border border-electric/25 bg-electric/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-electric sm:text-[11px]">
            {tournament}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-fg-faint">
            <Calendar size={11} /> {dateStr}
          </span>
        </div>

        {/* Venue (if present) */}
        {venue && (
          <div className="mb-3 flex items-center gap-1 text-[11px] text-fg-muted truncate">
            <MapPin size={11} className="shrink-0 text-fg-faint" />
            <span className="truncate">{venue}</span>
          </div>
        )}

        {/* Cricket Score Row */}
        {isCricket ? (
          <div className="min-w-0 space-y-2 rounded-xl bg-ink/50 p-3 border border-border/40">
            {/* 1st Innings */}
            <div className="flex min-w-0 items-center justify-between gap-2 text-sm font-bold text-fg">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span className="shrink-0 text-sm">🏏</span>
                <span className="min-w-0 truncate">{inn1Team}</span>
              </span>
              <span className="shrink-0 font-broadcast text-base sm:text-lg font-black text-electric">
                {inn1?.score ?? 0}/{inn1?.wickets ?? 0}{" "}
                <span className="font-sans text-[10px] font-normal text-fg-faint">
                  ({inn1?.overs || "0.0"} ov)
                </span>
              </span>
            </div>

            {/* 2nd Innings */}
            <div className="flex min-w-0 items-center justify-between gap-2 text-sm font-bold text-fg">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span className="shrink-0 text-sm">⚡</span>
                <span className="min-w-0 truncate">{inn2Team}</span>
              </span>
              <span className="shrink-0 font-broadcast text-base sm:text-lg font-black text-signal-gold">
                {inn2 ? (
                  <>
                    {inn2.score}/{inn2.wickets}{" "}
                    <span className="font-sans text-[10px] font-normal text-fg-faint">
                      ({inn2.overs || "0.0"} ov)
                    </span>
                  </>
                ) : (
                  <span className="font-sans text-[10px] font-medium text-fg-faint">Did not bat</span>
                )}
              </span>
            </div>
          </div>
        ) : (
          /* Football Score Row */
          <div className="min-w-0 space-y-2 rounded-xl bg-ink/50 p-3 border border-border/40">
            <div className="flex min-w-0 items-center justify-between gap-2 text-sm font-bold text-fg">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span className="shrink-0 text-sm">⚽</span>
                <span className="min-w-0 truncate">{teamA}</span>
                {(footballSnap?.redCardsA ?? 0) > 0 && <Square size={9} className="shrink-0 fill-crimson text-crimson" />}
              </span>
              <span className="shrink-0 font-broadcast text-xl font-black text-electric">{footballSnap?.scoreA ?? 0}</span>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2 text-sm font-bold text-fg">
              <span className="flex min-w-0 items-center gap-1.5 truncate">
                <span className="shrink-0 text-sm">⚽</span>
                <span className="min-w-0 truncate">{teamB}</span>
                {(footballSnap?.redCardsB ?? 0) > 0 && <Square size={9} className="shrink-0 fill-crimson text-crimson" />}
              </span>
              <span className="shrink-0 font-broadcast text-xl font-black text-signal-gold">{footballSnap?.scoreB ?? 0}</span>
            </div>
          </div>
        )}

        {/* Final Result / Winner Chip */}
        <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-signal-gold/30 bg-signal-gold/10 p-2.5 text-xs font-bold text-signal-gold">
          <Trophy className="h-3.5 w-3.5 shrink-0 text-signal-gold" />
          <span className="min-w-0 truncate">{finalResult}</span>
        </div>
      </div>

      {/* Button: View Scorecard */}
      <div className="border-t border-border pt-3">
        <Link href={`/match-history/${match.id}`} className="block">
          <button className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full border border-border bg-ink text-xs font-bold text-fg shadow-sm transition-colors group-hover:bg-panel-raised group-hover:border-electric/40">
            <Eye className="h-3.5 w-3.5 text-electric" />
            <span>View Full Scorecard</span>
          </button>
        </Link>
      </div>
    </div>
  );
}