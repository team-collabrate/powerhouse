"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import type { ClientDetail } from "@/lib/queries/clients";

type FormState = {
  companyName: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

function initial(c?: ClientDetail): FormState {
  return {
    companyName: c?.companyName ?? "",
    name: c?.contactName ?? "",
    email: c?.email ?? "",
    phone: c?.phone ?? "",
    address: c?.address ?? "",
    city: c?.city ?? "",
    country: c?.country ?? "",
  };
}

export function ClientDialog({
  client,
  trigger,
}: {
  client?: ClientDetail;
  trigger: (open: () => void) => React.ReactNode;
}) {
  const router = useRouter();
  const isEdit = !!client;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initial(client));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openDialog() {
    setForm(initial(client));
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

    const res = await fetch(
      isEdit ? `/api/clients/${client!.id}` : "/api/clients",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    if (isEdit) router.refresh();
    else router.push(`/clients/${json.data.id}`);
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
                {isEdit ? "Edit client" : "New client"}
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
                label="Company"
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                error={errors.companyName}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Contact name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  error={errors.name}
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  error={errors.email}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Phone (optional)"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  error={errors.phone}
                />
                <Field
                  label="City (optional)"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  error={errors.city}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Textarea
                  label="Address (optional)"
                  rows={2}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  error={errors.address}
                />
                <Field
                  label="Country (optional)"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  error={errors.country}
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
                  {saving ? "Saving…" : isEdit ? "Save changes" : "Create client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
