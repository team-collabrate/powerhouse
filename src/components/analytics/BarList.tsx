import { formatCurrency } from "@/lib/format";

export interface BarItem {
  label: string;
  amount: number;
  pct: number;
  sub?: string;
}

/** A labelled horizontal bar list, the shared idiom for the mix/breakdown cards. */
export function BarList({ items, empty }: { items: BarItem[]; empty?: string }) {
  if (items.length === 0) {
    return (
      <p className="px-5 pb-5 pt-4 text-[13px] text-ink-3">
        {empty ?? "Nothing in this period."}
      </p>
    );
  }
  return (
    <ul className="space-y-2.5 px-5 pb-5 pt-4">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-ink-2">
              {it.label}
              {it.sub && <span className="ml-1.5 text-ink-3">{it.sub}</span>}
            </span>
            <span className="tnum text-ink">
              {formatCurrency(it.amount)}{" "}
              <span className="text-ink-3">{it.pct}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${Math.max(1, Math.min(100, it.pct))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
