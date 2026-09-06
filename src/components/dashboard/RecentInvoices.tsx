import Link from "next/link";
import type { InvoiceRowView } from "@/lib/dashboard-types";
import { StatusBadge } from "./StatusBadge";

export function RecentInvoices({ rows }: { rows: InvoiceRowView[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 pb-8 pt-6 text-[13px] text-ink-3">
        No invoices yet.
      </div>
    );
  }

  return (
    <div className="px-2 pb-3 pt-2">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left">
            {["Invoice", "Client", "Status", "Amount"].map((h) => (
              <th key={h} className="eyebrow px-3 pb-2 pt-1 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((inv) => (
            <tr
              key={inv.id || inv.number}
              className="group border-t border-hairline transition-colors hover:bg-surface-sunken/60"
            >
              <td className="tnum px-3 py-2.5 text-[13px] font-medium text-ink">
                {inv.id ? (
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="group-hover:text-accent-strong"
                  >
                    {inv.number}
                  </Link>
                ) : (
                  inv.number
                )}
              </td>
              <td className="px-3 py-2.5 text-[13px] text-ink-2">{inv.client}</td>
              <td className="px-3 py-2.5">
                <StatusBadge status={inv.status} />
              </td>
              <td className="tnum px-3 py-2.5 text-[13px] font-medium text-ink">
                {inv.amount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
