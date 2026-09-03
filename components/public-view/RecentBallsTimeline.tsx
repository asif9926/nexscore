// components/public-view/RecentBallsTimeline.tsx
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
  if (label.startsWith("Wd") || label.startsWith("Nb")) return "bg-purple-600/30 text-purple-300 border-purple-500/50";
  if (label.includes("b") || label.includes("lb")) return "bg-panel-raised text-fg border-border";
  return "bg-panel-raised text-fg font-bold border-border";
}

// 🛡️ নিখুঁত ডেলিভারি কাউন্টার (সব ওয়াইড/নো-বলসহ চলতি ওভারের বল সংরক্ষণ)
const getCurrentOverDeliveries = (recentBalls: any[], overs: string): any[] => {
  if (!recentBalls || recentBalls.length === 0) return [];
  const parts = (overs || "0.0").split(".");
  const completedOvers = Number(parts[0] || 0);
  const currentBalls = Number(parts[1] || 0);

  if (completedOvers === 0 && currentBalls === 0) return [];

  const targetLegalBalls = currentBalls === 0 ? 6 : currentBalls;
  const deliveries: any[] = [];
  let legalCount = 0;

  for (let i = recentBalls.length - 1; i >= 0; i--) {
    const ball = recentBalls[i];
    deliveries.unshift(ball);

    const isLegal = typeof ball === "object" && ball !== null
      ? !ball.isExtra || ball.extraType === "Bye" || ball.extraType === "Leg Bye"
      : !String(ball).includes("Wd") && !String(ball).includes("Nb");

    if (isLegal) {
      legalCount++;
      if (legalCount >= targetLegalBalls) {
        break;
      }
    }
  }

  return deliveries;
};

export default function RecentBallsTimeline({ balls = [], overs = "0.0" }: Props) {
  if (!balls || balls.length === 0) return null;

  const currentOverDeliveries = getCurrentOverDeliveries(balls, overs);
  const [, ballsNum] = (overs || "0.0").split(".").map(Number);
  
  // চলতি ওভারের বাকি থাকা বৈধ বলের খালি স্লট
  const legalBallsRemaining = Math.max(0, 6 - (ballsNum === 0 ? 6 : ballsNum));

  const getLabel = (b: any) => (typeof b === "string" ? b : b.label || String(b.runs || "0"));
  const getTooltip = (b: any) => (typeof b === "object" ? b.text : undefined);

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