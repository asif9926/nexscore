import { Goal, Square } from "lucide-react";

interface FootballEvent {
  id: string;
  type: "goal" | "yellow_card" | "red_card";
  team: "teamA" | "teamB";
  minute: number;
  scorerName?: string;
  assistName?: string;
  playerName?: string;
  timestamp: number;
}

interface Props {
  events: FootballEvent[];
  teamAName: string;
  teamBName: string;
}

export default function MatchEventsList({ events, teamAName, teamBName }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-panel/50 py-10 text-center text-xs text-fg-faint">
        এখনো কোনো ইভেন্ট হয়নি — ম্যাচ চলাকালীন গোল ও কার্ডের আপডেট এখানে প্রদর্শিত হবে।
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => b.minute - a.minute || b.timestamp - a.timestamp);

  return (
    <ul className="space-y-2.5">
      {sorted.map((ev) => {
        const isGoal = ev.type === "goal";
        const isYellow = ev.type === "yellow_card";
        const isRed = ev.type === "red_card";
        const teamName = ev.team === "teamA" ? teamAName : teamBName;
        const alignRight = ev.team === "teamB";

        return (
          <li
            key={ev.id}
            className={`flex items-center gap-3 rounded-2xl border border-border bg-panel/80 p-3 shadow-sm transition-all hover:bg-panel-raised ${
              alignRight ? "flex-row-reverse text-right" : ""
            }`}
          >
            {/* Match Minute Badge */}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-ink font-mono text-xs font-bold text-fg">
              {ev.minute}'
            </span>

            {/* Event Icon */}
            <div className="shrink-0">
              {isGoal && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-pitch-green/40 bg-pitch-green/15 text-pitch-green">
                  <Goal size={16} />
                </div>
              )}
              {isYellow && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-signal-gold/40 bg-signal-gold/15 text-signal-gold">
                  <Square size={13} className="fill-signal-gold" />
                </div>
              )}
              {isRed && (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-crimson/40 bg-crimson/15 text-crimson">
                  <Square size={13} className="fill-crimson" />
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="flex-1 min-w-0">
              {isGoal ? (
                <div>
                  <div className="text-sm font-bold text-fg truncate">
                    <span>{ev.scorerName || "Player"}</span>
                    <span className="ml-1.5 text-xs font-normal text-pitch-green font-mono">⚽ GOAL</span>
                  </div>
                  {ev.assistName && (
                    <div className="text-[11px] text-fg-muted truncate">
                      Assist: <span className="font-semibold text-fg/80">{ev.assistName}</span> 👟
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-fg truncate">
                    <span>{ev.playerName || "Player"}</span>
                    <span className={`ml-1.5 text-xs font-semibold ${isRed ? "text-crimson" : "text-signal-gold"}`}>
                      {isRed ? "🟥 Red Card" : "🟨 Yellow Card"}
                    </span>
                  </div>
                  <div className="text-[10px] text-fg-faint uppercase font-bold tracking-wider">
                    {teamName}
                  </div>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}