import {
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Clock,
  MoreHorizontal,
  Percent,
  TrendingUp,
} from "react-feather";

const ICONS = {
  "trending-up": TrendingUp,
  briefcase: Briefcase,
  percent: Percent,
  clock: Clock,
} as const;

export interface KpiCardProps {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" };
  icon: keyof typeof ICONS;
  hint?: string;
  progress?: number;
}

export function KpiCard({ label, value, delta, icon, hint, progress }: KpiCardProps) {
  const Icon = ICONS[icon];
  const up = delta?.direction === "up";

  return (
    <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-4 shadow-[var(--shadow-card)] transition-colors hover:border-hairline-strong">
      <div className="flex items-center justify-between">
        <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-xs)] bg-surface-sunken text-ink-2">
          <Icon size={16} />
        </span>
        <button
          aria-label="Options"
          className="grid h-6 w-6 place-items-center rounded-md text-ink-3 hover:bg-surface-sunken"
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      <p className="eyebrow mt-3">{label}</p>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <span className="tnum text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
          {value}
        </span>
        {delta && (
          <span
            className={`tnum inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
              up ? "bg-profit-soft text-profit" : "bg-loss-soft text-loss"
            }`}
          >
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {delta.value}
          </span>
        )}
      </div>

      {hint && <p className="tnum mt-2 text-[11px] text-ink-3">{hint}</p>}
      {progress !== undefined && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        </div>
      )}
    </div>
  );
}
