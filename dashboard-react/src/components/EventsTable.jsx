function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function EventsTable({ readings }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="mb-4 font-semibold">History / Events</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-2 pr-4">Timestamp</th>
              <th className="pb-2 pr-4">Level</th>
              <th className="pb-2 pr-4">Source</th>
            </tr>
          </thead>
          <tbody>
            {(readings?.length ? readings : [null]).map((row, i) => (
              <tr key={row?.ts || i} className="border-t border-slate-800">
                <td className="py-2 pr-4">{row ? formatTs(row.ts) : "No history yet."}</td>
                <td className="py-2 pr-4">{row ? `${Number(row.level_pct).toFixed(1)}%` : "—"}</td>
                <td className="py-2 pr-4">{row?.source || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
