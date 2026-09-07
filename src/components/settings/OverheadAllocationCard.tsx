"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { formatCurrency } from "@/lib/format";
import {
  OVERHEAD_METHODS,
  OVERHEAD_METHOD_LABELS,
  type OverheadMethod,
} from "@/lib/overhead";

export function OverheadAllocationCard({
  method: initialMethod,
  ratePct: initialRatePct,
  monthlyPool,
}: {
  method: OverheadMethod;
  ratePct: number;
  monthlyPool: number;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<OverheadMethod>(initialMethod);
  const [ratePct, setRatePct] = useState(String(initialRatePct || 0));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const dirty =
    method !== initialMethod ||
    (method === "percent" && Number(ratePct) !== initialRatePct);

  function change(next: Partial<{ method: OverheadMethod; ratePct: string }>) {
    if (next.method !== undefined) setMethod(next.method);
    if (next.ratePct !== undefined) setRatePct(next.ratePct);
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
        overheadMethod: method,
        ...(method === "percent" ? { overheadRatePct: ratePct } : {}),
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

  const hint =
    method === "manual"
      ? "Each project's overhead is whatever you type into its Overhead field."
      : method === "percent"
        ? `Every open project is charged ${Number(ratePct) || 0}% of its contract value.`
        : method === "even"
          ? `Company overhead ≈ ${formatCurrency(monthlyPool)}/mo, split evenly across open projects and pro-rated by how many months each runs.`
          : `Company overhead ≈ ${formatCurrency(monthlyPool)}/mo, split across open projects by contract-value share and pro-rated by how many months each runs.`;

  return (
    <Card>
      <CardHeader title="Overhead allocation" menu={false} />
      <form onSubmit={submit} className="space-y-4 px-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Method"
            value={method}
            onChange={(e) => change({ method: e.target.value as OverheadMethod })}
          >
            {OVERHEAD_METHODS.map((m) => (
              <option key={m} value={m}>
                {OVERHEAD_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
          {method === "percent" && (
            <Field
              label="Overhead rate (%)"
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={ratePct}
              onChange={(e) => change({ ratePct: e.target.value })}
              error={errors.overheadRatePct}
            />
          )}
        </div>

        <p className="text-[12px] leading-relaxed text-ink-3">
          {hint} A project keeps its own value if you set its Overhead field
          above 0.
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
    </Card>
  );
}
