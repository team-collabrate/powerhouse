"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "react-feather";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";

interface ClientOption {
  id: string;
  label: string;
  contact: string;
}

export function ClientSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ companyName: "", name: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((j) => setClients(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function createClient() {
    setSaving(true);
    setAddError(null);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setAddError(json.error?.message ?? "Could not add client");
      return;
    }
    setClients((c) => [...c, json.data].sort((a, b) => a.label.localeCompare(b.label)));
    onChange(json.data.id);
    setAdding(false);
    setDraft({ companyName: "", name: "", email: "" });
  }

  if (adding) {
    return (
      <div className="rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-medium text-ink">New client</span>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="grid h-6 w-6 place-items-center rounded-md text-ink-3 hover:bg-surface"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-2">
          <Field
            label="Company"
            value={draft.companyName}
            onChange={(e) => setDraft((d) => ({ ...d, companyName: e.target.value }))}
          />
          <Field
            label="Contact name"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Field
            label="Email"
            type="email"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          />
          {addError && <p className="text-[12px] text-loss">{addError}</p>}
          <button
            type="button"
            onClick={createClient}
            disabled={saving || !draft.companyName || !draft.name || !draft.email}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add client"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Select
        label="Client"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
      >
        <option value="">{loading ? "Loading…" : "Select a client"}</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-accent-strong hover:underline"
      >
        <Plus size={13} />
        New client
      </button>
    </div>
  );
}
