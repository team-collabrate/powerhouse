import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import {
  SERVICE_TYPE_LABELS,
} from "@/lib/queries/projects";
import type { ProfitabilityRow } from "@/lib/queries/analytics";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";

export function ProfitabilityTable({ rows }: { rows: ProfitabilityRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-[13px] text-ink-3">
        No projects yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto px-2 pb-3 pt-1">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {[
              "Project",
              "Status",
              "Contract",
              "Team",
              "Expenses",
              "Overhead",
              "Profit",
              "Margin",
              "Progress",
            ].map((h, i) => (
              <th
                key={h}
                className={`eyebrow px-3 pb-2 pt-1 font-semibold ${
                  i > 1 ? "text-right" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-hairline">
              <td className="px-3 py-2.5">
                <Link
                  href={`/projects/${r.id}`}
                  className="text-[13px] font-medium text-ink hover:text-accent-strong"
                >
                  {r.name}
                </Link>
                <span className="block text-[11px] text-ink-3">
                  {r.client} · {SERVICE_TYPE_LABELS[r.serviceType]}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <ProjectStatusBadge status={r.status} />
              </td>
              <td className="tnum px-3 py-2.5 text-right text-[12.5px] text-ink-2">
                {formatCurrency(r.contractValue)}
              </td>
              <td className="tnum px-3 py-2.5 text-right text-[12.5px] text-ink-2">
                {formatCurrency(r.teamCost)}
              </td>
              <td className="tnum px-3 py-2.5 text-right text-[12.5px] text-ink-2">
                {formatCurrency(r.expenses)}
              </td>
              <td className="tnum px-3 py-2.5 text-right text-[12.5px] text-ink-2">
                {formatCurrency(r.overhead)}
              </td>
              <td
                className={`tnum px-3 py-2.5 text-right text-[12.5px] font-medium ${
                  r.profit >= 0 ? "text-ink" : "text-loss"
                }`}
              >
                {formatCurrency(r.profit)}
              </td>
              <td
                className={`tnum px-3 py-2.5 text-right text-[12.5px] font-semibold ${
                  r.margin >= 20
                    ? "text-profit"
                    : r.margin >= 0
                      ? "text-ink"
                      : "text-loss"
                }`}
              >
                {r.margin}%
              </td>
              <td className="tnum px-3 py-2.5 text-right text-[12.5px] text-ink-3">
                {r.progress}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
