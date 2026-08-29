import { Goal, Square } from "lucide-react";

interface FootballEvent {
  id: string;
  type: "goal" | "yellow_card" | "red_card";
  team: "teamA" | "teamB";
  minute: number;
  timestamp: number;
}

interface Props {
  events: FootballEvent[];
  teamAName: string;
  teamBName: string;
}

const EVENT_META: Record<FootballEvent["type"], { icon: React.ReactNode; label: string; color: string }> = {
  goal: { icon: <Goal size={16} />, label: "Goal", color: "text-pitch-green" },
  yellow_card: { icon: <Square size={12} className="fill-signal-gold text-signal-gold" />, label: "Yellow Card", color: "text-signal-gold" },
  red_card: { icon: <Square size={12} className="fill-crimson text-crimson" />, label: "Red Card", color: "text-crimson" },
};

export default function MatchEventsList({ events, teamAName, teamBName }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-panel/50 py-12 text-center text-fg-faint">
        এখনো কোনো ইভেন্ট হয়নি — ম্যাচ শুরু হলে গোল ও কার্ড এখানে দেখাবে।
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <ul className="space-y-2">
      {sorted.map((ev) => {
        const meta = EVENT_META[ev.type];
        const teamName = ev.team === "teamA" ? teamAName : teamBName;
        const alignRight = ev.team === "teamB";
        return (
          <li
            key={ev.id}
            className={`flex items-center gap-3 rounded-xl border border-border bg-panel/60 px-4 py-2.5 ${
              alignRight ? "flex-row-reverse text-right" : ""
            }`}
          >
            <span className="w-9 shrink-0 font-mono text-xs font-bold text-fg-faint">{ev.minute}'</span>
            <span className={meta.color}>{meta.icon}</span>
            <span className="flex-1 text-sm text-fg">
              <span className="font-semibold">{teamName}</span>
              <span className="text-fg-faint"> — {meta.label}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
