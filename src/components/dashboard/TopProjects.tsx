import { TOP_PROJECTS } from "@/lib/demo-data";

export function TopProjects() {
  return (
    <ul className="px-5 pb-5 pt-4">
      {TOP_PROJECTS.map((p, i) => (
        <li
          key={p.name}
          className={i > 0 ? "mt-4 border-t border-hairline pt-4" : ""}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-[13px] font-medium text-ink">{p.name}</p>
            <p className="tnum text-[13px] font-semibold text-ink">
              {p.margin}%
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${p.margin}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink-3">
            <span className="truncate">{p.client}</span>
            <span className="tnum">
              {p.profit} <span className="text-ink-3/70">/ {p.contract}</span>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
