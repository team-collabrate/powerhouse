import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { ClientListItem } from "@/lib/queries/clients";

export function ClientsTable({ items }: { items: ClientListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">No clients match</p>
        <p className="mt-1 text-[13px] text-ink-3">
          Adjust the search, or add one.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-hairline bg-surface-raised">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline text-left">
            {["Client", "Email", "Projects", "Lifetime value", "Outstanding"].map(
              (h) => (
                <th key={h} className="eyebrow px-4 py-2.5 font-semibold">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr
              key={c.id}
              className="group border-b border-hairline last:border-0 transition-colors hover:bg-surface-sunken/60"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/clients/${c.id}`}
                  className="flex items-center gap-2 text-[13.5px] font-medium text-ink group-hover:text-accent-strong"
                >
                  {c.companyName}
                  {!c.isActive && (
                    <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-3">
                      Inactive
                    </span>
                  )}
                </Link>
                <span className="text-[11.5px] text-ink-3">{c.contactName}</span>
              </td>
              <td className="px-4 py-3 text-[13px] text-ink-2">{c.email}</td>
              <td className="tnum px-4 py-3 text-[13px] text-ink-2">
                {c.projectCount}
              </td>
              <td className="tnum px-4 py-3 text-[13px] text-ink">
                {formatCurrency(c.lifetimeValue)}
              </td>
              <td className="tnum px-4 py-3 text-[13px]">
                {c.outstanding === 0 ? (
                  <span className="text-ink-3">-</span>
                ) : (
                  <span className="text-ink-2">
                    {formatCurrency(c.outstanding)}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
