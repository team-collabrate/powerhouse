import { formatCurrency } from "@/lib/format";
import type { DsoResult } from "@/lib/reports/dso";

export function DsoCard({ data }: { data: DsoResult }) {
  if (data.paidCount === 0) {
    return (
      <p className="px-5 pb-5 pt-4 text-[13px] text-ink-3">
        No invoices were paid in this period.
      </p>
    );
  }
  return (
    <div className="px-5 pb-5 pt-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Average" value={`${data.avgDays}d`} />
        <Stat label="Median" value={`${data.medianDays}d`} />
        <Stat label="₹-weighted" value={`${data.weightedAvgDays}d`} />
      </div>
      <p className="mt-2 text-[12px] text-ink-3">
        Across {data.paidCount} {data.paidCount === 1 ? "invoice" : "invoices"}{" "}
        paid this period, from issue to payment.
      </p>

      {data.slowest.length > 0 && (
        <div className="mt-3 border-t border-hairline pt-3">
          <p className="eyebrow mb-2">Slowest to settle</p>
          <ul className="space-y-1.5">
            {data.slowest.map((s) => (
              <li
                key={s.invoiceNumber}
                className="flex items-baseline justify-between text-[12.5px]"
              >
                <span className="text-ink-2">{s.invoiceNumber}</span>
                <span className="tnum text-ink">
                  {s.days}d
                  <span className="ml-1.5 text-ink-3">
                    {formatCurrency(s.amount)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-surface-sunken px-3 py-2.5">
      <p className="eyebrow">{label}</p>
      <p className="tnum mt-1 text-[17px] font-semibold text-ink">{value}</p>
    </div>
  );
}
