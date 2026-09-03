// components/public-view/BattingTable.tsx
"use client";

import { Batsman } from "@/lib/types/match";
import { safeArray, calculateSR } from "@/lib/utils";

export default function BattingTable({ batsmen = [] }: { batsmen: Batsman[] }) {
  const list = safeArray<Batsman>(batsmen);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border shadow-md">
      <table className="w-full text-left text-xs sm:text-sm text-fg-muted whitespace-nowrap">
        <thead className="bg-panel-raised/60 text-[11px] uppercase tracking-wider text-fg-muted border-b border-border">
          <tr>
            <th className="px-4 py-3.5">Batter</th>
            <th className="px-4 py-3.5">Dismissal</th>
            <th className="px-4 py-3.5 text-right font-bold text-fg">R</th>
            <th className="px-4 py-3.5 text-right">B</th>
            <th className="px-4 py-3.5 text-right">4s</th>
            <th className="px-4 py-3.5 text-right">6s</th>
            <th className="px-4 py-3.5 text-right pr-6">SR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-panel/40">
          {list.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-6 text-center text-xs text-fg-faint">
                কোনো ব্যাটারের তথ্য পাওয়া যায়নি
              </td>
            </tr>
          ) : (
            list.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-panel-raised/40">
                <td className="px-4 py-3 font-bold text-fg">
                  <div className="flex items-center gap-1.5">
                    <span>{b.name}</span>
                    {b.onStrike && <span className="text-signal-gold text-base leading-none">*</span>}
                    {!b.isOut && (
                      <span className="rounded-full border border-electric/30 bg-electric/15 px-1.5 py-0.5 text-[9px] uppercase font-bold text-electric">
                        NOT OUT
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-fg-muted">
                  {b.isOut ? b.dismissal || "Out" : "Not Out"}
                </td>
                <td className="px-4 py-3 text-right font-broadcast text-base font-bold text-electric">{b.runs}</td>
                <td className="px-4 py-3 text-right font-mono text-fg-muted">{b.balls}</td>
                <td className="px-4 py-3 text-right font-mono text-fg-muted">{b.fours}</td>
                <td className="px-4 py-3 text-right font-mono text-fg-muted">{b.sixes}</td>
                <td className="px-4 py-3 pr-6 text-right font-mono text-fg-muted">{calculateSR(b.runs, b.balls)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}