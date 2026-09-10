import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { ProjectListItem } from "@/lib/queries/projects";
import { ProjectStatusBadge } from "./ProjectStatusBadge";

export function ProjectsTable({ items }: { items: ProjectListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">No projects match</p>
        <p className="mt-1 text-[13px] text-ink-3">
          Try a different filter, or create a project.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-hairline bg-surface-raised">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline text-left">
            {["Project", "Client", "Status", "Contract", "Profit", "Progress"].map(
              (h) => (
                <th key={h} className="eyebrow px-4 py-2.5 font-semibold">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              className="group border-b border-hairline last:border-0 transition-colors hover:bg-surface-sunken/60"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/projects/${p.id}`}
                  className="block text-[13.5px] font-medium text-ink group-hover:text-accent-strong"
                >
                  {p.name}
                </Link>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-ink-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: p.serviceColor }}
                  />
                  {p.serviceLabel}
                </span>
              </td>
              <td className="px-4 py-3 text-[13px] text-ink-2">{p.clientName}</td>
              <td className="px-4 py-3">
                <ProjectStatusBadge status={p.status} />
              </td>
              <td className="tnum px-4 py-3 text-[13px] text-ink">
                {formatCurrency(p.contractValue)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`tnum text-[13px] font-medium ${
                    p.profit >= 0 ? "text-ink" : "text-loss"
                  }`}
                >
                  {formatCurrency(p.profit)}
                </span>
                <span className="tnum ml-1.5 text-[11.5px] text-ink-3">
                  {p.profitMargin.toFixed(0)}%
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${p.progressPercentage}%` }}
                    />
                  </div>
                  <span className="tnum text-[11.5px] text-ink-3">
                    {p.progressPercentage}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
