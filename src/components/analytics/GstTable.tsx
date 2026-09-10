import { formatCurrency } from "@/lib/format";
import type { GstQuarterRow, GstSummary } from "@/lib/reports/gst";

export function GstTable({
  byQuarter,
  summary,
  periodLabel,
}: {
  byQuarter: GstQuarterRow[];
  summary: GstSummary;
  periodLabel: string;
}) {
  return (
    <div className="px-2 pb-3 pt-1">
      <p className="px-3 pb-2 text-[12.5px] text-ink-3">
        <span className="tnum font-semibold text-ink">
          {formatCurrency(summary.tax)}
        </span>{" "}
        tax on {formatCurrency(summary.taxable)} taxable value across{" "}
        {summary.invoiceCount}{" "}
        {summary.invoiceCount === 1 ? "invoice" : "invoices"} — {periodLabel}.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {["Quarter", "Invoices", "Taxable", "Tax"].map((h, i) => (
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
            {byQuarter.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-3 text-ink-3">
                  No tax-bearing invoices yet.
                </td>
              </tr>
            )}
            {byQuarter.map((q) => (
              <tr key={q.label} className="border-t border-hairline">
                <td className="px-3 py-2 text-ink">{q.label}</td>
                <td className="tnum px-3 py-2 text-right text-ink-2">
                  {q.invoiceCount}
                </td>
                <td className="tnum px-3 py-2 text-right text-ink-2">
                  {formatCurrency(q.taxable)}
                </td>
                <td className="tnum px-3 py-2 text-right font-medium text-ink">
                  {formatCurrency(q.tax)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
