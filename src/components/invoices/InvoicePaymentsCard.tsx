"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "react-feather";
import { Card } from "@/components/dashboard/Card";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PaymentDialog } from "./PaymentDialog";
import { useCan } from "@/components/providers/SessionProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
  type InvoiceDetail,
} from "@/lib/queries/invoices";

export function InvoicePaymentsCard({ invoice }: { invoice: InvoiceDetail }) {
  const router = useRouter();
  const canPay = useCan("payment:write");
  const canRecord =
    canPay &&
    (invoice.status === "sent" ||
      invoice.status === "partial" ||
      invoice.status === "overdue");

  async function remove(id: string) {
    await fetch(`/api/payments/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Card>
      <header className="flex items-center justify-between px-5 pt-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            Payments
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {formatCurrency(invoice.amountPaid)} of{" "}
            {formatCurrency(invoice.amount)} received
          </p>
        </div>
        {canRecord && (
          <PaymentDialog
            invoiceId={invoice.id}
            balance={invoice.balance}
            trigger={(open) => (
              <button
                onClick={open}
                className="inline-flex h-8 items-center rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 text-[12.5px] font-medium text-ink hover:bg-surface-sunken"
              >
                Record
              </button>
            )}
          />
        )}
      </header>

      {invoice.payments.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-ink-3">
          No payments recorded.
        </p>
      ) : (
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Date", "Method", "Reference", "Amount"].map((h) => (
                  <th
                    key={h}
                    className="eyebrow px-3 pb-2 pt-1 text-left font-semibold"
                  >
                    {h}
                  </th>
                ))}
                {canPay && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id} className="group border-t border-hairline">
                  <td className="tnum px-3 py-2 text-[12.5px] text-ink-2">
                    {formatDate(p.paymentDate)}
                  </td>
                  <td className="px-3 py-2 text-[12.5px] text-ink-2">
                    {PAYMENT_METHOD_LABELS[p.paymentMethod as PaymentMethod] ??
                      p.paymentMethod}
                  </td>
                  <td className="px-3 py-2 text-[12.5px] text-ink-3">
                    {p.referenceNumber || "-"}
                  </td>
                  <td className="tnum px-3 py-2 text-[12.5px] font-medium text-ink">
                    {formatCurrency(p.amount)}
                  </td>
                  {canPay && (
                    <td className="px-2 py-1.5">
                      <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <ConfirmButton
                          label="Delete payment"
                          question="Delete?"
                          confirmLabel="Delete"
                          onConfirm={() => remove(p.id)}
                        >
                          <Trash2 size={13} />
                        </ConfirmButton>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
