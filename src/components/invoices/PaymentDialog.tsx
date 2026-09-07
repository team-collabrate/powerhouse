"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/queries/invoices";

export function PaymentDialog({
  invoiceId,
  balance,
  trigger,
}: {
  invoiceId: string;
  balance: number;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => blank(balance));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function blankReset() {
    setForm(blank(balance));
    setErrors({});
    setSubmitError(null);
    setOpen(true);
  }
  function set(k: keyof ReturnType<typeof blank>, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSubmitError(null);
    const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      if (json.error?.code === "VALIDATION_ERROR" && Array.isArray(json.error.details)) {
        const fe: Record<string, string> = {};
        for (const d of json.error.details) fe[d.field] = d.issue;
        setErrors(fe);
      } else {
        setSubmitError(json.error?.message ?? "Something went wrong");
      }
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {trigger(blankReset)}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
          <button
            aria-label="Close"
            className="fixed inset-0 bg-ink/25"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-[420px] rounded-[var(--radius-md)] border border-hairline bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h3 className="text-[15px] font-semibold text-ink">
                Record payment
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-md text-ink-3 hover:bg-surface-sunken"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Amount (₹)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  error={errors.amount}
                  autoFocus
                />
                <Field
                  label="Date"
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => set("paymentDate", e.target.value)}
                  error={errors.paymentDate}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Method"
                  value={form.paymentMethod}
                  onChange={(e) => set("paymentMethod", e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </Select>
                <Field
                  label="Reference (optional)"
                  value={form.referenceNumber}
                  onChange={(e) => set("referenceNumber", e.target.value)}
                  error={errors.referenceNumber}
                />
              </div>

              <Textarea
                label="Notes (optional)"
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />

              {submitError && <p className="text-[12px] text-loss">{submitError}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink hover:bg-surface-sunken"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Record payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function blank(balance: number) {
  return {
    amount: balance > 0 ? String(balance) : "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "bank_transfer",
    referenceNumber: "",
    notes: "",
  };
}
