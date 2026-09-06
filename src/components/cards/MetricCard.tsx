import { ArrowDownRight, ArrowUpRight } from "react-feather";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
  label: string;
  value: string;
  change?: { value: string; positive: boolean };
}

export function MetricCard({ label, value, change }: MetricCardProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-bg-card p-5 transition-all hover:border-primary hover:shadow-[0_4px_12px_var(--color-primary-soft)]">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-3 text-[32px] font-semibold leading-none text-text-primary">
        {value}
      </p>
      {change && (
        <p
          className={cn(
            "mt-3 flex items-center gap-1 text-xs font-medium",
            change.positive ? "text-success" : "text-error",
          )}
        >
          {change.positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}
          {change.value}
        </p>
      )}
    </div>
  );
}
