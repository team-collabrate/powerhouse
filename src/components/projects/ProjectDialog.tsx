"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ClientSelect } from "./ClientSelect";
import {
  PROJECT_STATUSES,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type ProjectDetail,
} from "@/lib/queries/projects";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  in_review: "In Review",
  delivered: "Delivered",
  closed: "Closed",
};

type FormState = {
  name: string;
  clientId: string;
  serviceType: string;
  status: string;
  contractValue: string;
  teamCost: string;
  allocatedOverhead: string;
  progressPercentage: string;
  startDate: string;
  deadline: string;
  description: string;
};

function initial(project?: ProjectDetail): FormState {
  return {
    name: project?.name ?? "",
    clientId: project?.clientId ?? "",
    serviceType: project?.serviceType ?? "other",
    status: project?.status ?? "active",
    contractValue: project ? String(project.contractValue) : "",
    teamCost: project ? String(project.teamCost) : "0",
    allocatedOverhead: project ? String(project.allocatedOverhead) : "0",
    progressPercentage: project ? String(project.progressPercentage) : "0",
    startDate: project?.startDate ? project.startDate.slice(0, 10) : "",
    deadline: project?.deadline ? project.deadline.slice(0, 10) : "",
    description: project?.description ?? "",
  };
}

export function ProjectDialog({
  project,
  trigger,
}: {
  project?: ProjectDetail;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!project;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initial(project));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openDialog() {
    setForm(initial(project));
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

    const payload = {
      name: form.name,
      clientId: form.clientId,
      serviceType: form.serviceType,
      status: form.status,
      contractValue: form.contractValue,
      teamCost: form.teamCost || "0",
      allocatedOverhead: form.allocatedOverhead || "0",
      progressPercentage: form.progressPercentage || "0",
      startDate: form.startDate,
      deadline: form.deadline,
      description: form.description,
    };

    const res = await fetch(
      isEdit ? `/api/projects/${project!.id}` : "/api/projects",
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
        const fieldErrors: Record<string, string> = {};
        for (const d of json.error.details) fieldErrors[d.field] = d.issue;
        setErrors(fieldErrors);
      } else {
        setSubmitError(json.error?.message ?? "Something went wrong");
      }
      return;
    }

    if (isEdit) {
      setOpen(false);
      router.refresh();
    } else {
      // navigation unmounts the dialog
      router.push(`/projects/${json.data.id}`);
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
          <div className="relative z-10 w-full max-w-[520px] rounded-[var(--radius-md)] border border-hairline bg-surface shadow-[var(--shadow-pop)]">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <h3 className="text-[15px] font-semibold text-ink">
                {isEdit ? "Edit project" : "New project"}
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
                label="Project name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                error={errors.name}
                autoFocus
              />

              <ClientSelect
                value={form.clientId}
                onChange={(id) => set("clientId", id)}
                error={errors.clientId}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Service"
                  value={form.serviceType}
                  onChange={(e) => set("serviceType", e.target.value)}
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {SERVICE_TYPE_LABELS[s]}
                    </option>
                  ))}
                </Select>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Contract value ($)"
                  type="number"
                  min={0}
                  step="100"
                  value={form.contractValue}
                  onChange={(e) => set("contractValue", e.target.value)}
                  error={errors.contractValue}
                />
                <Field
                  label="Team cost ($)"
                  type="number"
                  min={0}
                  step="100"
                  value={form.teamCost}
                  onChange={(e) => set("teamCost", e.target.value)}
                  error={errors.teamCost}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Allocated overhead ($)"
                  type="number"
                  min={0}
                  step="100"
                  value={form.allocatedOverhead}
                  onChange={(e) => set("allocatedOverhead", e.target.value)}
                  error={errors.allocatedOverhead}
                />
                <Field
                  label="Progress (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={form.progressPercentage}
                  onChange={(e) => set("progressPercentage", e.target.value)}
                  error={errors.progressPercentage}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Start date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  error={errors.startDate}
                />
                <Field
                  label="Deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => set("deadline", e.target.value)}
                  error={errors.deadline}
                />
              </div>

              <Textarea
                label="Description"
                rows={3}
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
                  {saving ? "Saving…" : isEdit ? "Save changes" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
