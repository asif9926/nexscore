import Link from "next/link";
import { History, Trophy, ArrowRight } from "lucide-react";
import MatchResultCard from "@/components/common/MatchResultCard";

interface Props {
  matches: any[];
}

export default function RecentMatchesList({ matches }: Props) {
  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border pb-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold text-fg sm:text-2xl">
            <History className="h-5 w-5 shrink-0 text-electric" />
            <span className="truncate">Recent Matches & Scorecards</span>
          </h2>
          <p className="mt-1 text-xs text-fg-muted">Completed match history snapshots & digital scorecards</p>
        </div>

        {matches.length > 0 && (
          <Link
            href="/match-history"
            className="flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-electric transition-colors hover:text-fg"
          >
            <span className="hidden sm:inline">View All Archives</span>
            <span className="sm:hidden">View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {matches.length === 0 ? (
        <div className="space-y-3 rounded-3xl border border-border bg-panel p-12 text-center shadow-xl">
          <Trophy size={40} className="mx-auto mb-2 text-fg-faint" />
          <h3 className="text-lg font-bold text-fg">No Archived Matches</h3>
          <p className="text-sm text-fg-muted">Match history will automatically appear here once finalized.</p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
          {matches.map((match) => (
            <MatchResultCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
