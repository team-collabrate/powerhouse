import { formatCurrency } from "@/lib/format";
import type { AgingResult } from "@/lib/reports/aging";

export function AgingChart({ data }: { data: AgingResult }) {
  const max = Math.max(1, ...data.buckets.map((b) => b.amount));
  const overdue = data.buckets
    .filter((b) => b.bucket !== "current")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div className="px-5 pb-5 pt-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] text-ink-3">
          <span className="tnum font-semibold text-ink">
            {formatCurrency(data.total)}
          </span>{" "}
          outstanding
        </p>
        <p className="text-[12px] text-ink-3">
          <span className="tnum text-loss">{formatCurrency(overdue)}</span> overdue
        </p>
      </div>

      <div className="mt-3 space-y-2">
        {data.buckets.map((b) => (
          <div key={b.bucket} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-[12px] text-ink-3">{b.label}</span>
            <div className="h-4 flex-1 overflow-hidden rounded-[3px] bg-surface-sunken">
              <div
                className={`h-full rounded-[3px] ${
                  b.bucket === "current" ? "bg-hairline-strong" : "bg-loss/70"
                }`}
                style={{ width: `${(b.amount / max) * 100}%` }}
              />
            </div>
            <span className="tnum w-24 shrink-0 text-right text-[12px] text-ink-2">
              {formatCurrency(b.amount)}
            </span>
          </div>
        ))}
      </div>

      {data.byClient.length > 0 && (
        <div className="mt-4 border-t border-hairline pt-3">
          <p className="eyebrow mb-2">Owed by</p>
          <ul className="space-y-1.5">
            {data.byClient.slice(0, 5).map((c) => (
              <li
                key={c.clientName}
                className="flex items-baseline justify-between text-[12.5px]"
              >
                <span className="text-ink-2">{c.clientName}</span>
                <span className="tnum text-ink">
                  {formatCurrency(c.amount)}
                  {c.oldestDays > 0 && (
                    <span className="ml-1.5 text-ink-3">{c.oldestDays}d</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
