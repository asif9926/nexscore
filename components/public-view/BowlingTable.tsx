// components/public-view/BowlingTable.tsx
"use client";

import { Bowler } from "@/lib/types/match";
import { safeArray, calculateEconomy } from "@/lib/utils";

export default function BowlingTable({ bowlers = [] }: { bowlers: Bowler[] }) {
  const list = safeArray<Bowler>(bowlers);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border shadow-md">
      <table className="w-full text-left text-xs sm:text-sm text-fg-muted whitespace-nowrap">
        <thead className="bg-panel-raised/60 text-[11px] uppercase tracking-wider text-fg-muted border-b border-border">
          <tr>
            <th className="px-4 py-3.5">Bowler</th>
            <th className="px-4 py-3.5 text-right">O</th>
            <th className="px-4 py-3.5 text-right">M</th>
            <th className="px-4 py-3.5 text-right">R</th>
            <th className="px-4 py-3.5 text-right font-bold text-fg">W</th>
            <th className="px-4 py-3.5 pr-6 text-right">ECON</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-panel/40">
          {list.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-xs text-fg-faint">
                কোনো বোলারের তথ্য পাওয়া যায়নি
              </td>
            </tr>
          ) : (
            list.map((b) => (
              <tr key={b.id} className="transition-colors hover:bg-panel-raised/40">
                <td className="px-4 py-3 font-bold text-fg">
                  <div className="flex items-center gap-1.5">
                    <span>{b.name}</span>
                    {b.isActive && (
                      <span className="rounded-full border border-crimson/30 bg-crimson/15 px-1.5 py-0.5 text-[9px] uppercase font-bold text-crimson">
                        Bowling
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-fg-muted">{b.overs}</td>
                <td className="px-4 py-3 text-right font-mono text-fg-muted">{b.maidens}</td>
                <td className="px-4 py-3 text-right font-mono text-fg-muted">{b.runs}</td>
                <td className="px-4 py-3 text-right font-broadcast text-base font-bold text-crimson">{b.wickets}</td>
                <td className="px-4 py-3 pr-6 text-right font-mono text-fg-muted">{calculateEconomy(b.runs, b.overs)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}