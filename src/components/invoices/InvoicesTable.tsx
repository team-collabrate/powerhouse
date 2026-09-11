import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceListItem } from "@/lib/queries/invoices";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export function InvoicesTable({ items }: { items: InvoiceListItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">No invoices match</p>
        <p className="mt-1 text-[13px] text-ink-3">
          Try a different filter, or create one.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-hairline bg-surface-raised">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-hairline text-left">
            {["Invoice", "Client", "Status", "Amount", "Balance", "Due"].map(
              (h) => (
                <th key={h} className="eyebrow px-4 py-2.5 font-semibold">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr
              key={i.id}
              className="group border-b border-hairline last:border-0 transition-colors hover:bg-surface-sunken/60"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/invoices/${i.id}`}
                  className="tnum block text-[13px] font-medium text-ink group-hover:text-accent-strong"
                >
                  {i.invoiceNumber}
                </Link>
                <span className="text-[11.5px] text-ink-3">{i.projectName}</span>
              </td>
              <td className="px-4 py-3 text-[13px] text-ink-2">{i.clientName}</td>
              <td className="px-4 py-3">
                <StatusBadge status={i.status} />
              </td>
              <td className="tnum px-4 py-3 text-[13px] text-ink">
                {formatCurrency(i.amount)}
              </td>
              <td className="tnum px-4 py-3 text-[13px]">
                {i.balance === 0 ? (
                  <span className="text-ink-3">-</span>
                ) : (
                  <span
                    className={
                      i.status === "overdue" ? "text-loss" : "text-ink-2"
                    }
                  >
                    {formatCurrency(i.balance)}
                  </span>
                )}
              </td>
              <td className="tnum px-4 py-3 text-[12.5px] text-ink-3">
                {formatDate(i.dueDate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
