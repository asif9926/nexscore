// components/public-view/RecentBallsTimeline.tsx
"use client";

import { getCurrentOverDeliveries } from "@/lib/utils";

interface Props {
  balls: any[];
  overs?: string;
}

function ballStyle(label: string) {
  if (label === "W" || label.includes("W")) return "bg-crimson text-white border-crimson shadow-sm";
  if (label === "6") return "bg-signal-gold text-ink font-black border-signal-gold shadow-sm";
  if (label === "4") return "bg-electric text-white font-black border-electric shadow-sm";
  if (label === "0" || label === "•" || label === "⊙") return "bg-panel-raised text-fg-faint border-border";
  if (label.startsWith("Wd") || label.startsWith("Nb")) return "bg-purple-600/30 text-purple-300 border-purple-500/50";
  if (label.includes("b") || label.includes("lb")) return "bg-panel-raised text-fg border-border";
  return "bg-panel-raised text-fg font-bold border-border";
}

export default function RecentBallsTimeline({ balls = [], overs = "0.0" }: Props) {
  if (!balls || balls.length === 0) return null;

  const currentOverDeliveries = getCurrentOverDeliveries(balls, overs);
  const [, ballsNum] = (overs || "0.0").split(".").map(Number);

  // 🛡️ ৬ বলের বেশি হলে ওভারের সর্বশেষ ৬টি বল (Sliding Window) প্রদর্শন
  const isExtended = currentOverDeliveries.length > 6;
  const displayDeliveries = isExtended
    ? currentOverDeliveries.slice(-6)
    : currentOverDeliveries;

  const currentLegalCount = (ballsNum === 0 && overs !== "0.0") ? 6 : (ballsNum || 0);
  const legalBallsRemaining = isExtended
    ? 0
    : Math.max(0, 6 - currentLegalCount);

  const getLabel = (b: any) => (typeof b === "string" ? b : b.label || String(b.runs || "0"));
  const getTooltip = (b: any) => (typeof b === "object" ? b.text : undefined);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="mr-1 shrink-0 text-xs font-bold uppercase tracking-wider text-fg-muted">
        This Over ({overs}):
      </span>

      <div className="flex items-center gap-1.5">
        {displayDeliveries.map((b, i) => {
          const label = getLabel(b);
          return (
            <span
              key={`ball_${i}_${label}`}
              className={`flex h-7 min-w-[28px] px-1 shrink-0 cursor-default items-center justify-center rounded-full border text-xs font-bold transition-transform hover:scale-110 ${ballStyle(label)}`}
              title={getTooltip(b)}
            >
              {label === "0" ? "•" : label}
            </span>
          );
        })}

        {Array.from({ length: legalBallsRemaining }).map((_, i) => (
          <span
            key={`empty_${i}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border/80 bg-ink/40 text-[10px] text-fg-faint"
          >
            -
          </span>
        ))}
      </div>
    </div>
  );
}