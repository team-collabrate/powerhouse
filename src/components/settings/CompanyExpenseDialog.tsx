"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import {
  COMPANY_EXPENSE_CATEGORIES,
  COMPANY_EXPENSE_CATEGORY_LABELS,
  RECURRING_FREQUENCIES,
  type CompanyExpenseRow,
} from "@/lib/queries/settings";

function initial(e?: CompanyExpenseRow) {
  return {
    category: e?.category ?? "software",
    description: e?.description ?? "",
    amount: e ? String(e.amount) : "",
    dateIncurred: e
      ? e.dateIncurred.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    isRecurring: e?.isRecurring ?? false,
    recurringFrequency: e?.recurringFrequency ?? "monthly",
  };
}

export function CompanyExpenseDialog({
  expense,
  trigger,
}: {
  expense?: CompanyExpenseRow;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!expense;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => initial(expense));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openDialog() {
    setForm(initial(expense));
    setErrors({});
    setSubmitError(null);
    setOpen(true);
  }
  function set<K extends keyof ReturnType<typeof initial>>(
    k: K,
    v: ReturnType<typeof initial>[K],
  ) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSubmitError(null);
    const payload = {
      category: form.category,
      description: form.description,
      amount: form.amount,
      dateIncurred: form.dateIncurred,
      isRecurring: form.isRecurring,
      recurringFrequency: form.isRecurring
        ? form.recurringFrequency
        : isEdit
          ? null
          : undefined,
    };
    const res = await fetch(
      isEdit ? `/api/company-expenses/${expense!.id}` : "/api/company-expenses",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      if (Array.isArray(json.error?.details)) {
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
          <div className="relative z-10 w-full max-w-[420px] rounded-[var(--radius-md)] border border-hairline bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h3 className="text-[15px] font-semibold text-ink">
                {isEdit ? "Edit overhead" : "Add overhead"}
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
                <Select
                  label="Category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value as typeof form.category)}
                >
                  {COMPANY_EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {COMPANY_EXPENSE_CATEGORY_LABELS[c]}
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
                {form.isRecurring && (
                  <Select
                    label="Recurs"
                    value={form.recurringFrequency}
                    onChange={(e) =>
                      set(
                        "recurringFrequency",
                        e.target.value as typeof form.recurringFrequency,
                      )
                    }
                    error={errors.recurringFrequency}
                  >
                    {RECURRING_FREQUENCIES.map((f) => (
                      <option key={f} value={f}>
                        {f[0].toUpperCase() + f.slice(1)}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              <label className="flex items-center gap-2 text-[13px] text-ink-2">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => set("isRecurring", e.target.checked)}
                  className="h-4 w-4 rounded border-hairline-strong accent-[var(--accent)]"
                />
                Recurring expense
              </label>

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
                  {saving ? "Saving…" : isEdit ? "Save" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
