import type { Chart } from "@/content/types";

export function BarChart({ chart }: { chart: Chart }) {
  const max = chart.max ?? Math.max(...chart.rows.map((row) => row.value));

  return (
    <figure>
      <figcaption className="font-display text-xl sm:text-2xl">{chart.title}</figcaption>
      <table className="mt-6 w-full border-separate border-spacing-y-1 text-left">
        <thead className="sr-only">
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row) => (
            <tr key={row.label} className="group">
              <th
                scope="row"
                className="w-[40%] py-1.5 pr-3 align-middle text-sm font-normal text-muted group-hover:text-ink sm:w-[32%]"
              >
                {row.label}
              </th>
              <td className="py-1.5 align-middle">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div
                      className="h-3 min-w-1 rounded-r bg-lime/85 transition-colors group-hover:bg-lime"
                      style={{ width: `${(row.value / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right font-mono text-sm text-ink">
                    {row.display}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-muted">{chart.note}</p>
    </figure>
  );
}
