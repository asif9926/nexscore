"use client";

interface Props {
  balls: any[];
  overs?: string;
}

function ballStyle(label: string) {
  if (label === "W") return "bg-crimson text-white border-crimson shadow-sm";
  if (label === "6") return "bg-signal-gold text-ink font-black border-signal-gold shadow-sm";
  if (label === "4") return "bg-electric text-white font-black border-electric shadow-sm";
  if (label === "0" || label === "•" || label === "⊙") return "bg-panel-raised text-fg-faint border-border";
  if (label.startsWith("Wd") || label.startsWith("Nb")) return "bg-signal-gold/20 text-signal-gold border-signal-gold/40";
  if (label.includes("b") || label.includes("lb")) return "bg-panel-raised text-fg border-border";
  return "bg-panel-raised text-fg font-bold border-border";
}

export default function RecentBallsTimeline({ balls = [], overs = "0.0" }: Props) {
  if (!balls || balls.length === 0) return null;

  const [oversNum, ballsNum] = overs.split(".").map(Number);
  
  // চলতি ওভারের বল সংখ্যা নির্ধারণ
  const legalBallsInThisOver = ballsNum === 0 && oversNum > 0 ? 6 : ballsNum;
  
  // শুধু চলতি ওভারের বলগুলো ফিল্টার
  const currentOverDeliveries = balls.slice(-Math.max(legalBallsInThisOver, 1));

  const getLabel = (b: any) => (typeof b === "string" ? b : b.label || String(b.runs || "0"));
  const getTooltip = (b: any) => (typeof b === "object" ? b.text : undefined);

  // ওভারের মোট ৬টি স্লট পূরণ করার জন্য
  const totalSlots = Math.max(6, currentOverDeliveries.length);
  const remainingSlots = Math.max(0, 6 - currentOverDeliveries.length);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="mr-1 shrink-0 text-xs font-bold uppercase tracking-wider text-fg-muted">
        This Over ({overs}):
      </span>

      <div className="flex items-center gap-1.5">
        {currentOverDeliveries.map((b, i) => {
          const label = getLabel(b);
          return (
            <span
              key={`ball_${i}`}
              className={`flex h-7 w-7 shrink-0 cursor-default items-center justify-center rounded-full border text-xs font-bold transition-transform hover:scale-110 ${ballStyle(label)}`}
              title={getTooltip(b)}
            >
              {label === "0" ? "•" : label}
            </span>
          );
        })}

        {/* ওভারের বাকি বলগুলোর জন্য ফাঁকা স্লট */}
        {Array.from({ length: remainingSlots }).map((_, i) => (
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