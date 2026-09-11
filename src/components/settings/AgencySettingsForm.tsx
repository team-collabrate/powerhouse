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
    replyToEmail: settings.replyToEmail ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const dirty =
    form.name !== settings.name ||
    Number(form.monthlyRevenueTarget) !== settings.monthlyRevenueTarget ||
    form.replyToEmail !== (settings.replyToEmail ?? "");

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
        replyToEmail: form.replyToEmail,
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
          label="Monthly revenue target (₹)"
          type="number"
          min={0}
          step="1000"
          value={form.monthlyRevenueTarget}
          onChange={(e) => set("monthlyRevenueTarget", e.target.value)}
          error={errors.monthlyRevenueTarget}
        />
      </div>

      <div className="border-t border-hairline pt-4">
        <Field
          label="Reply-to email (optional)"
          type="email"
          value={form.replyToEmail}
          onChange={(e) => set("replyToEmail", e.target.value)}
          error={errors.replyToEmail}
          placeholder="billing@youragency.com"
        />
        <p className="mt-1.5 text-[12px] text-ink-3">
          Invoice and invite emails are sent from the Powerhouse address, but
          when a client hits <span className="font-medium">Reply</span> it goes
          here. Leave blank to use the platform default.
        </p>
      </div>

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
