"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type {
  InvoiceDetail,
  InvoiceProjectOption,
} from "@/lib/queries/invoices";

type FormState = {
  projectId: string;
  amount: string;
  issueDate: string;
  dueDate: string;
  notes: string;
};

function initial(
  invoice: InvoiceDetail | undefined,
  projects: InvoiceProjectOption[],
): FormState {
  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  return {
    projectId: invoice?.projectId ?? projects[0]?.id ?? "",
    amount: invoice ? String(invoice.amount) : "",
    issueDate: invoice?.issueDate ? invoice.issueDate.slice(0, 10) : today,
    dueDate: invoice?.dueDate ? invoice.dueDate.slice(0, 10) : in14,
    notes: invoice?.notes ?? "",
  };
}

export function InvoiceDialog({
  invoice,
  projects,
  trigger,
}: {
  invoice?: InvoiceDetail;
  projects: InvoiceProjectOption[];
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!invoice;
  const locked = isEdit && invoice!.status !== "draft"; // amount / issue date locked
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initial(invoice, projects));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const client = projects.find((p) => p.id === form.projectId)?.clientName;

  function openDialog() {
    setForm(initial(invoice, projects));
    setErrors({});
    setSubmitError(null);
    setOpen(true);
  }
  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSubmitError(null);

    const body = isEdit
      ? locked
        ? { dueDate: form.dueDate, notes: form.notes }
        : {
            amount: form.amount,
            issueDate: form.issueDate,
            dueDate: form.dueDate,
            notes: form.notes,
          }
      : {
          projectId: form.projectId,
          amount: form.amount,
          issueDate: form.issueDate,
          dueDate: form.dueDate,
          notes: form.notes,
        };

    const res = await fetch(
      isEdit ? `/api/invoices/${invoice!.id}` : "/api/invoices",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
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

    if (isEdit) {
      setOpen(false);
      router.refresh();
    } else {
      router.push(`/invoices/${json.data.id}`);
    }
  }

  return (
    <>
      {trigger(openDialog)}

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
          <button
            aria-label="Close"
            className="fixed inset-0 bg-ink/25"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-[460px] rounded-[var(--radius-md)] border border-hairline bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h3 className="text-[15px] font-semibold text-ink">
                {isEdit ? `Edit ${invoice!.invoiceNumber}` : "New invoice"}
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
              <div>
                <Select
                  label="Project"
                  value={form.projectId}
                  onChange={(e) => set("projectId", e.target.value)}
                  error={errors.projectId}
                  disabled={isEdit}
                >
                  <option value="">Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                {client && (
                  <p className="mt-1 text-[12px] text-ink-3">Bills to {client}</p>
                )}
              </div>

              <Field
                label="Amount (₹)"
                type="number"
                min={0}
                step="100"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                error={errors.amount}
                disabled={locked}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Issue date"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => set("issueDate", e.target.value)}
                  error={errors.issueDate}
                  disabled={locked}
                />
                <Field
                  label="Due date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                  error={errors.dueDate}
                />
              </div>

              <Textarea
                label="Notes (optional)"
                rows={2}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                error={errors.notes}
              />

              {locked && (
                <p className="text-[12px] text-ink-3">
                  This invoice has been sent — only the due date and notes can
                  change.
                </p>
              )}
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
                  {saving ? "Saving…" : isEdit ? "Save changes" : "Create draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
