import { AlertTriangle, ArrowRight, FileText } from "react-feather";
import type { InsightView } from "@/lib/dashboard-types";

const ICONS = { "alert-triangle": AlertTriangle, "file-text": FileText } as const;

export function InsightsCard({ items }: { items: InsightView[] }) {
  return (
    <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
      <ul className="flex-1 space-y-4">
        {items.map((it) => {
          const Icon = ICONS[it.icon];
          return (
            <li key={it.title} className="flex gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-xs)] bg-surface-sunken text-ink-2">
                <Icon size={15} />
              </span>
              <div>
                <p className="text-[13px] font-medium leading-snug text-ink">
                  {it.title}
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-ink-3">
                  {it.body}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <button className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken">
        Open assistant
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
