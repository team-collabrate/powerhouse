import { ArrowUpRight, ArrowDownRight } from "react-feather";
import type { Metric } from "@/lib/reports/shared";

/**
 * A headline number with its change vs the prior comparable period.
 * `unit` picks the delta suffix: "%" shows a relative change, "pts" shows a
 * pre-computed point difference (pass it via `pointsDelta`).
 */
export function DeltaStat({
  label,
  value,
  metric,
  pointsDelta,
  invertColour,
  prevLabel,
}: {
  label: string;
  value: string;
  metric?: Metric;
  pointsDelta?: number | null;
  /** true when "up" is bad (e.g. cost) */
  invertColour?: boolean;
  prevLabel?: string;
}) {
  const dir = metric?.direction ?? (pointsDelta == null ? "flat" : pointsDelta > 0 ? "up" : pointsDelta < 0 ? "down" : "flat");
  const has = dir !== "flat";
  const good = invertColour ? dir === "down" : dir === "up";
  const text =
    pointsDelta != null
      ? `${pointsDelta > 0 ? "+" : ""}${pointsDelta} pts`
      : metric?.deltaPct != null
        ? `${metric.deltaPct > 0 ? "+" : ""}${metric.deltaPct}%`
        : "-";

  return (
    <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-4">
      <p className="eyebrow">{label}</p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <span className="tnum text-[20px] font-semibold tracking-[-0.02em] text-ink">
          {value}
        </span>
        <span
          className={`tnum inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
            !has
              ? "text-ink-3"
              : good
                ? "bg-profit-soft text-profit"
                : "bg-loss-soft text-loss"
          }`}
        >
          {has ? (
            dir === "up" ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )
          ) : null}
          {text}
        </span>
      </div>
      {prevLabel && (
        <p className="tnum mt-1.5 text-[11px] text-ink-3">vs {prevLabel}</p>
      )}
    </div>
  );
}
