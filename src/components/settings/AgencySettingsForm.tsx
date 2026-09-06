"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import type { AgencySettings } from "@/lib/queries/settings";

export function AgencySettingsForm({ settings }: { settings: AgencySettings }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: settings.name,
    monthlyRevenueTarget: String(settings.monthlyRevenueTarget),
    brandColor: settings.brandColor,
    logoUrl: settings.logoUrl ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const dirty =
    form.name !== settings.name ||
    Number(form.monthlyRevenueTarget) !== settings.monthlyRevenueTarget ||
    form.brandColor !== settings.brandColor ||
    form.logoUrl !== (settings.logoUrl ?? "");

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setStatus("idle");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrors({});
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        monthlyRevenueTarget: form.monthlyRevenueTarget,
        brandColor: form.brandColor,
        logoUrl: form.logoUrl,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus("idle");
      if (Array.isArray(json.error?.details)) {
        const fe: Record<string, string> = {};
        for (const d of json.error.details) fe[d.field] = d.issue;
        setErrors(fe);
      }
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-5 py-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Agency name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={errors.name}
        />
        <Field
          label="Monthly revenue target ($)"
          type="number"
          min={0}
          step="1000"
          value={form.monthlyRevenueTarget}
          onChange={(e) => set("monthlyRevenueTarget", e.target.value)}
          error={errors.monthlyRevenueTarget}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink">
            Brand colour
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.brandColor}
              onChange={(e) => set("brandColor", e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-[var(--radius-sm)] border border-hairline-strong bg-surface p-1"
            />
            <input
              value={form.brandColor}
              onChange={(e) => set("brandColor", e.target.value)}
              className="h-10 w-full rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 font-mono text-[13px] outline-none focus:border-accent"
            />
          </div>
          {errors.brandColor && (
            <span className="mt-1 block text-[12px] text-loss">
              {errors.brandColor}
            </span>
          )}
        </label>
        <Field
          label="Logo URL (optional)"
          value={form.logoUrl}
          onChange={(e) => set("logoUrl", e.target.value)}
          error={errors.logoUrl}
          placeholder="https://…"
        />
      </div>

      <p className="text-[12px] text-ink-3">
        Brand colour and logo are stored for the upcoming client portal and
        invoice PDFs — they don&apos;t restyle this dashboard.
      </p>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!dirty || status === "saving"}
          className="inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && (
          <span className="text-[12px] text-profit">Saved</span>
        )}
      </div>
    </form>
  );
}
