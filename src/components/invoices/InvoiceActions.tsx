"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Send, Slash, Trash2 } from "react-feather";
import { InvoiceDialog } from "./InvoiceDialog";
import { PaymentDialog } from "./PaymentDialog";
import { useCan } from "@/components/providers/SessionProvider";
import type {
  InvoiceDetail,
  InvoiceProjectOption,
} from "@/lib/queries/invoices";

const btn =
  "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken disabled:opacity-50";
const primary =
  "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50";

export function InvoiceActions({
  invoice,
  projects,
}: {
  invoice: InvoiceDetail;
  projects: InvoiceProjectOption[];
}) {
  const router = useRouter();
  const canInvoice = useCan("invoice:write");
  const canPay = useCan("payment:write");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!canInvoice && !canPay) return null;

  async function post(path: string, label: string) {
    setBusy(label);
    const res = await fetch(path, { method: "POST" });
    setBusy(null);
    if (res.ok) router.refresh();
    else {
      const j = await res.json().catch(() => null);
      alert(j?.error?.message ?? "Action failed");
    }
  }

  async function remove() {
    setBusy("delete");
    const res = await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
    setBusy(null);
    if (res.ok) router.push("/invoices");
  }

  const { status } = invoice;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canInvoice && status === "draft" && (
        <button
          className={primary}
          disabled={busy !== null}
          onClick={() => post(`/api/invoices/${invoice.id}/send`, "send")}
        >
          <Send size={14} />
          {busy === "send" ? "Sending…" : "Send"}
        </button>
      )}

      {canPay &&
        (status === "sent" || status === "partial" || status === "overdue") && (
          <PaymentDialog
            invoiceId={invoice.id}
            balance={invoice.balance}
            trigger={(open) => (
              <button className={primary} onClick={open}>
                Record payment
              </button>
            )}
          />
        )}

      {canInvoice && status !== "cancelled" && (
        <InvoiceDialog
          invoice={invoice}
          projects={projects}
          trigger={(open) => (
            <button className={btn} onClick={open}>
              <Edit2 size={14} />
              Edit
            </button>
          )}
        />
      )}

      {canInvoice && status === "draft" &&
        (confirmingDelete ? (
          <span className="inline-flex items-center gap-2 text-[13px]">
            <span className="text-ink-2">Delete this draft?</span>
            <button onClick={remove} disabled={busy !== null} className={primary}>
              {busy === "delete" ? "…" : "Delete"}
            </button>
            <button onClick={() => setConfirmingDelete(false)} className={btn}>
              Cancel
            </button>
          </span>
        ) : (
          <button className={btn} onClick={() => setConfirmingDelete(true)}>
            <Trash2 size={14} />
            Delete
          </button>
        ))}

      {canInvoice && (status === "sent" || status === "overdue") &&
        (confirmingCancel ? (
          <span className="inline-flex items-center gap-2 text-[13px]">
            <span className="text-ink-2">Cancel {invoice.invoiceNumber}?</span>
            <button
              onClick={() => post(`/api/invoices/${invoice.id}/cancel`, "cancel")}
              disabled={busy !== null}
              className={primary}
            >
              {busy === "cancel" ? "…" : "Yes, cancel"}
            </button>
            <button onClick={() => setConfirmingCancel(false)} className={btn}>
              Keep
            </button>
          </span>
        ) : (
          <button className={btn} onClick={() => setConfirmingCancel(true)}>
            <Slash size={14} />
            Cancel invoice
          </button>
        ))}
    </div>
  );
}
