"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  MILESTONE_STATUSES,
  MILESTONE_STATUS_LABELS,
  type MilestoneRow,
} from "@/lib/queries/milestones";

type FormState = {
  name: string;
  description: string;
  dueDate: string;
  status: string;
};

function initial(m?: MilestoneRow): FormState {
  return {
    name: m?.name ?? "",
    description: m?.description ?? "",
    dueDate: m ? m.dueDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    status: m?.status ?? "pending",
  };
}

export function MilestoneDialog({
  projectId,
  milestone,
  trigger,
}: {
  projectId: string;
  milestone?: MilestoneRow;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!milestone;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initial(milestone));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openDialog() {
    setForm(initial(milestone));
    setErrors({});
    setSubmitError(null);
    setOpen(true);
  }
  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSubmitError(null);

    const res = await fetch(
      isEdit
        ? `/api/milestones/${milestone!.id}`
        : `/api/projects/${projectId}/milestones`,
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      },
    );
    const json = await res.json();
    setSaving(false);

    if (!res.ok) {
      if (
        json.error?.code === "VALIDATION_ERROR" &&
        Array.isArray(json.error.details)
      ) {
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
                {isEdit ? "Edit milestone" : "Add milestone"}
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
              <Field
                label="Name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Due date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                  error={errors.dueDate}
                />
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {MILESTONE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {MILESTONE_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>

              <Textarea
                label="Notes (optional)"
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                error={errors.description}
              />

              {submitError && (
                <p className="text-[12px] text-loss">{submitError}</p>
              )}

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
                  {saving ? "Saving…" : isEdit ? "Save changes" : "Add milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
