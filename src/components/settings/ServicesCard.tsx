"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "react-feather";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { Field } from "@/components/ui/Field";
import { SERVICE_COLOR_OPTIONS, DEFAULT_SERVICE_COLOR } from "@/lib/services";
import type { ServiceRow } from "@/lib/queries/services";

function Swatches({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SERVICE_COLOR_OPTIONS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.name}
          onClick={() => onChange(c.value)}
          className={`h-6 w-6 rounded-full border-2 transition-transform ${
            value === c.value
              ? "scale-110 border-ink"
              : "border-transparent hover:scale-105"
          }`}
          style={{ background: c.value }}
        />
      ))}
    </div>
  );
}

export function ServicesCard({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_SERVICE_COLOR);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error?.message ?? "Could not save");
      return;
    }
    router.refresh();
  }

  async function create() {
    setBusy("new");
    setError(null);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    setBusy(null);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error?.message ?? "Could not add");
      return;
    }
    setAdding(false);
    setName("");
    setColor(DEFAULT_SERVICE_COLOR);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Services"
        subtitle="Categories a project can be tagged with, each with a colour"
        menu={false}
      />
      <div className="px-5 pb-5 pt-2">
        <ul className="divide-y divide-hairline">
          {services.map((s) => (
            <li
              key={s.id}
              className={`flex flex-wrap items-center gap-3 py-3 ${
                s.isActive ? "" : "opacity-50"
              }`}
            >
              <Swatches
                value={s.color}
                onChange={(v) => patch(s.id, { color: v })}
              />
              <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">
                {s.name}
                {!s.isActive && (
                  <span className="ml-2 text-[11px] font-normal text-ink-3">
                    hidden
                  </span>
                )}
              </span>
              <button
                type="button"
                disabled={busy === s.id}
                onClick={() => patch(s.id, { isActive: !s.isActive })}
                className="text-[12px] font-medium text-ink-3 hover:text-ink-2 disabled:opacity-50"
              >
                {s.isActive ? "Hide" : "Show"}
              </button>
            </li>
          ))}
        </ul>

        {error && <p className="mt-2 text-[12px] text-loss">{error}</p>}

        {adding ? (
          <div className="mt-3 rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium text-ink">New service</span>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="grid h-6 w-6 place-items-center rounded-md text-ink-3 hover:bg-surface"
              >
                <X size={14} />
              </button>
            </div>
            <Field
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App, SEO, Retainer"
            />
            <div className="mt-2">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">
                Colour
              </span>
              <Swatches value={color} onChange={setColor} />
            </div>
            <button
              type="button"
              onClick={create}
              disabled={busy === "new" || !name.trim()}
              className="mt-3 inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-accent px-3 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {busy === "new" ? "Adding…" : "Add service"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent-strong hover:underline"
          >
            <Plus size={14} />
            New service
          </button>
        )}
      </div>
    </Card>
  );
}
