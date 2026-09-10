import Link from "next/link";
import type { MilestoneRollup } from "@/lib/queries/milestone-rollup";

export function DeliverablesSection({
  data,
  periodLabel,
}: {
  data: MilestoneRollup;
  periodLabel: string;
}) {
  const rows = [...data.overdue, ...data.upcoming];

  return (
    <div className="px-5 pb-5 pt-4">
      <div className="flex flex-wrap gap-6">
        <Stat label={`Completed in ${periodLabel}`} value={String(data.completedInPeriod)} />
        <Stat
          label="On-time rate (all time)"
          value={data.onTimeRate == null ? "—" : `${data.onTimeRate}%`}
        />
        <Stat label="Overdue now" value={String(data.overdue.length)} />
      </div>

      {rows.length > 0 && (
        <ul className="mt-4 divide-y divide-hairline border-t border-hairline">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/projects/${r.projectId}`}
                className="flex items-baseline justify-between gap-3 py-2 text-[12.5px] hover:text-accent-strong"
              >
                <span className="min-w-0 truncate text-ink">
                  {r.name}
                  <span className="ml-1.5 text-ink-3">{r.projectName}</span>
                </span>
                <span
                  className={`tnum shrink-0 font-medium ${
                    r.daysAway < 0 ? "text-loss" : "text-ink-3"
                  }`}
                >
                  {r.daysAway < 0
                    ? `${Math.abs(r.daysAway)}d overdue`
                    : `in ${r.daysAway}d`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="tnum mt-1 text-[18px] font-semibold text-ink">{value}</p>
    </div>
  );
}
