import { MoreHorizontal } from "react-feather";
import { RECENT_INVOICES } from "@/lib/demo-data";
import { StatusBadge } from "./StatusBadge";

export function RecentInvoices() {
  return (
    <div className="px-2 pb-3 pt-2">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left">
            {["Invoice", "Client", "Status", "Amount", ""].map((h) => (
              <th
                key={h}
                className="eyebrow px-3 pb-2 pt-1 font-semibold last:w-8"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RECENT_INVOICES.map((inv) => (
            <tr
              key={inv.number}
              className="border-t border-hairline transition-colors hover:bg-surface-sunken/60"
            >
              <td className="tnum px-3 py-2.5 text-[13px] font-medium text-ink">
                {inv.number}
              </td>
              <td className="px-3 py-2.5 text-[13px] text-ink-2">{inv.client}</td>
              <td className="px-3 py-2.5">
                <StatusBadge status={inv.status} />
              </td>
              <td className="tnum px-3 py-2.5 text-[13px] font-medium text-ink">
                {inv.amount}
              </td>
              <td className="px-3 py-2.5">
                <button
                  aria-label={`Options for ${inv.number}`}
                  className="grid h-6 w-6 place-items-center rounded-md text-ink-3 hover:bg-surface"
                >
                  <MoreHorizontal size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
