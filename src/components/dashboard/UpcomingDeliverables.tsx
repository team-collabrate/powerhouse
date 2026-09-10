import Link from "next/link";
import type { DeliverablesView } from "@/lib/dashboard-types";

function when(daysAway: number): { text: string; tone: string } {
  if (daysAway < 0)
    return { text: `${Math.abs(daysAway)}d overdue`, tone: "text-loss" };
  if (daysAway === 0) return { text: "due today", tone: "text-loss" };
  if (daysAway <= 3) return { text: `in ${daysAway}d`, tone: "text-ink-2" };
  return { text: `in ${daysAway}d`, tone: "text-ink-3" };
}

export function UpcomingDeliverables({ data }: { data: DeliverablesView }) {
  const rows = [...data.overdue, ...data.upcoming];

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center px-5 pb-5 pt-4 text-[13px] text-ink-3">
        No milestones due in the next 30 days.
      </div>
    );
  }

  return (
    <ul className="flex-1 divide-y divide-hairline px-2 pb-2 pt-1">
      {rows.map((r) => {
        const w = when(r.daysAway);
        return (
          <li key={r.id}>
            <Link
              href={`/projects/${r.projectId}`}
              className="flex items-baseline justify-between gap-3 rounded-md px-3 py-2 hover:bg-surface-sunken"
            >
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-ink">
                  {r.name}
                </span>
                <span className="block truncate text-[11px] text-ink-3">
                  {r.projectName}
                </span>
              </span>
              <span className={`tnum shrink-0 text-[12px] font-medium ${w.tone}`}>
                {w.text}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
