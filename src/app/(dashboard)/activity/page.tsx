import Link from "next/link";
import { getSessionContext } from "@/lib/session";
import { getActivity, activityHref } from "@/lib/queries/activity-feed";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function relative(iso: string, now: Date): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}

const dayKey = (iso: string) => new Date(iso).toDateString();

export default async function ActivityPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">
          Connect a database to see activity
        </p>
      </div>
    );
  }

  const { entries } = await getActivity(ctx.agencyId);
  const now = new Date();

  const groups: { label: string; items: typeof entries }[] = [];
  for (const e of entries) {
    const k = dayKey(e.at);
    const last = groups[groups.length - 1];
    if (last && dayKey(last.items[0].at) === k) last.items.push(e);
    else
      groups.push({
        label:
          k === now.toDateString()
            ? "Today"
            : k === new Date(now.getTime() - 86400000).toDateString()
              ? "Yesterday"
              : formatDate(e.at),
        items: [e],
      });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
          Activity
        </h2>
        <p className="mt-1 text-[13px] text-ink-3">
          Everything your team has changed, most recent first.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center text-[13px] text-ink-3">
          No activity yet.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="eyebrow mb-2">{g.label}</p>
              <ul className="overflow-hidden rounded-[var(--radius-md)] border border-hairline bg-surface-raised">
                {g.items.map((e) => {
                  const href = activityHref(e);
                  const body = (
                    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
                      <p className="text-[12.5px] text-ink">
                        <span className="font-medium">{e.actor}</span>{" "}
                        <span className="text-ink-2">{e.description}</span>
                      </p>
                      <span className="tnum shrink-0 text-[11px] text-ink-3">
                        {relative(e.at, now)}
                      </span>
                    </div>
                  );
                  return (
                    <li
                      key={e.id}
                      className="border-b border-hairline last:border-0"
                    >
                      {href ? (
                        <Link href={href} className="block hover:bg-surface-sunken">
                          {body}
                        </Link>
                      ) : (
                        body
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
