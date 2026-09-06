"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseRow,
} from "@/lib/queries/expenses";

type FormState = {
  projectId: string;
  category: string;
  amount: string;
  description: string;
  dateIncurred: string;
  receiptUrl: string;
};

function initial(
  expense: ExpenseRow | undefined,
  fixedProjectId: string | undefined,
): FormState {
  return {
    projectId: expense?.projectId ?? fixedProjectId ?? "",
    category: expense?.category ?? "software",
    amount: expense ? String(expense.amount) : "",
    description: expense?.description ?? "",
    dateIncurred: expense
      ? expense.dateIncurred.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    receiptUrl: expense?.receiptUrl ?? "",
  };
}

export function ExpenseDialog({
  projectId,
  projects,
  expense,
  trigger,
}: {
  /** fixes the project (project detail page) — hides the picker */
  projectId?: string;
  /** options for the picker (standalone /expenses page) */
  projects?: { id: string; name: string }[];
  expense?: ExpenseRow;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!expense;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initial(expense, projectId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openDialog() {
    setForm(initial(expense, projectId));
    setErrors({});
    setSubmitError(null);
    setOpen(true);
  }
  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId) {
      setErrors({ projectId: "Select a project" });
      return;
    }
    setSaving(true);
    setErrors({});
    setSubmitError(null);

    const payload = {
      category: form.category,
      amount: form.amount,
      description: form.description,
      dateIncurred: form.dateIncurred,
      receiptUrl: form.receiptUrl,
    };

    const res = await fetch(
      isEdit
        ? `/api/expenses/${expense!.id}`
        : `/api/projects/${form.projectId}/expenses`,
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

    setOpen(false);
    router.refresh();
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
          <div className="relative z-10 w-full max-w-[440px] rounded-[var(--radius-md)] border border-hairline bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h3 className="text-[15px] font-semibold text-ink">
                {isEdit ? "Edit expense" : "Add expense"}
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
              {!projectId && (
                <Select
                  label="Project"
                  value={form.projectId}
                  onChange={(e) => set("projectId", e.target.value)}
                  error={errors.projectId}
                  disabled={isEdit}
                >
                  <option value="">Select a project</option>
                  {(projects ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {EXPENSE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </Select>
                <Field
                  label="Amount ($)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  error={errors.amount}
                />
              </div>

              <Field
                label="Description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                error={errors.description}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Date"
                  type="date"
                  value={form.dateIncurred}
                  onChange={(e) => set("dateIncurred", e.target.value)}
                  error={errors.dateIncurred}
                />
                <Field
                  label="Receipt URL (optional)"
                  value={form.receiptUrl}
                  onChange={(e) => set("receiptUrl", e.target.value)}
                  error={errors.receiptUrl}
                />
              </div>

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
                  {saving ? "Saving…" : isEdit ? "Save changes" : "Add expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
