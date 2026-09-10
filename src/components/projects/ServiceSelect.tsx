"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import {
  SERVICE_COLOR_OPTIONS,
  DEFAULT_SERVICE_COLOR,
} from "@/lib/services";

interface Option {
  slug: string;
  name: string;
  color: string;
}

export function ServiceSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (slug: string) => void;
  error?: string;
}) {
  const [services, setServices] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_SERVICE_COLOR);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((j) => setServices(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function create() {
    setSaving(true);
    setAddError(null);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setAddError(json.error?.message ?? "Could not add service");
      return;
    }
    setServices((s) => [...s, json.data]);
    onChange(json.data.slug);
    setAdding(false);
    setName("");
    setColor(DEFAULT_SERVICE_COLOR);
  }

  if (adding) {
    return (
      <div className="rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken p-3">
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
          <div className="flex flex-wrap gap-1.5">
            {SERVICE_COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.name}
                onClick={() => setColor(c.value)}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  color === c.value
                    ? "scale-110 border-ink"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </div>
        {addError && <p className="mt-2 text-[12px] text-loss">{addError}</p>}
        <button
          type="button"
          onClick={create}
          disabled={saving || !name.trim()}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add service"}
        </button>
      </div>
    );
  }

  const current = services.find((s) => s.slug === value);

  return (
    <div>
      <Select
        label="Service"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
      >
        {loading && <option value={value}>Loading…</option>}
        {!loading && !current && value && (
          <option value={value}>{value}</option>
        )}
        {services.map((s) => (
          <option key={s.slug} value={s.slug}>
            {s.name}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent-strong hover:underline"
      >
        <Plus size={13} />
        New service
      </button>
    </div>
  );
}
