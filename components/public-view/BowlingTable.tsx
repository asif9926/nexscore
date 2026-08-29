"use client";

export default function BowlingTable({ bowlers = [] }: { bowlers: any[] }) {
  return (
    <div className="mt-4 w-full overflow-x-auto rounded-xl border border-border shadow-lg">
      <table className="w-full text-left text-sm text-fg-muted">
        <thead className="bg-panel-raised text-xs uppercase text-fg-muted">
          <tr>
            <th className="px-4 py-3">Bowler</th>
            <th className="px-4 py-3 text-right">O</th>
            <th className="px-4 py-3 text-right">M</th>
            <th className="px-4 py-3 text-right">R</th>
            <th className="px-4 py-3 text-right font-bold text-fg">W</th>
            <th className="px-4 py-3 text-right">ECON</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-panel/50">
          {bowlers.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-6 text-center text-fg-faint">
                No bowlers data available
              </td>
            </tr>
          ) : (
            bowlers.map((b, i) => {
              const [overs, balls] = (b.overs || "0.0").split(".").map(Number);
              const totalOvers = overs + balls / 6;
              const econ = totalOvers > 0 ? (b.runs / totalOvers).toFixed(1) : "0.0";

              return (
                <tr key={i} className="transition-colors hover:bg-panel-raised/50">
                  <td className="px-4 py-3 font-medium text-fg">{b.name}</td>
                  <td className="px-4 py-3 text-right">{b.overs}</td>
                  <td className="px-4 py-3 text-right">{b.maidens}</td>
                  <td className="px-4 py-3 text-right">{b.runs}</td>
                  <td className="px-4 py-3 text-right font-bold text-crimson">{b.wickets}</td>
                  <td className="px-4 py-3 text-right">{econ}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
