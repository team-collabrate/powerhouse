import { formatCurrency } from "@/lib/format";
import type { ClientRanking } from "@/lib/reports/client-ranking";

export function ClientConcentration({ data }: { data: ClientRanking }) {
  const withRevenue = data.rows.filter((r) => r.paidInPeriod > 0);

  if (withRevenue.length === 0) {
    return (
      <p className="px-5 pb-5 pt-4 text-[13px] text-ink-3">
        No client payments in this period.
      </p>
    );
  }

  return (
    <div className="px-2 pb-3 pt-1">
      <p className="px-3 pb-2 text-[12.5px] text-ink-3">
        Top client is{" "}
        <span className="tnum font-semibold text-ink">{data.top1Pct}%</span> of
        period revenue; top 3 are{" "}
        <span className="tnum font-semibold text-ink">{data.top3Pct}%</span>.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {["Client", "Revenue", "Share", "Cumulative"].map((h, i) => (
                <th
                  key={h}
                  className={`eyebrow px-3 pb-2 pt-1 font-semibold ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {withRevenue.map((r) => (
              <tr key={r.id} className="border-t border-hairline">
                <td className="px-3 py-2 text-ink">{r.name}</td>
                <td className="tnum px-3 py-2 text-right text-ink">
                  {formatCurrency(r.paidInPeriod)}
                </td>
                <td className="tnum px-3 py-2 text-right text-ink-2">
                  {r.revenuePct}%
                </td>
                <td className="tnum px-3 py-2 text-right text-ink-3">
                  {r.cumulativePct}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
