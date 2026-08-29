"use client";

export default function BattingTable({ batsmen = [] }: { batsmen: any[] }) {
  return (
    <div className="mt-4 w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm text-fg-muted">
        <thead className="bg-panel-raised text-xs uppercase text-fg-muted">
          <tr>
            <th className="px-4 py-3">Batsman</th>
            <th className="px-4 py-3 text-right text-fg">R</th>
            <th className="px-4 py-3 text-right">B</th>
            <th className="px-4 py-3 text-right">4s</th>
            <th className="px-4 py-3 text-right">6s</th>
            <th className="px-4 py-3 text-right">SR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-panel/50">
          {batsmen.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-fg-faint">
                No batsmen data available
              </td>
            </tr>
          ) : (
            batsmen.map((b, i) => (
              <tr key={i} className="transition-colors hover:bg-panel-raised/50">
                <td className="px-4 py-3 font-medium text-fg">
                  {b.name} {b.onStrike && <span className="text-lg leading-none text-signal-gold">*</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold text-fg">{b.runs}</td>
                <td className="px-4 py-3 text-right">{b.balls}</td>
                <td className="px-4 py-3 text-right">{b.fours}</td>
                <td className="px-4 py-3 text-right">{b.sixes}</td>
                <td className="px-4 py-3 text-right">{b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : "0.0"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
