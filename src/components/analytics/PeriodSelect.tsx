"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { PERIOD_PRESETS, PERIOD_PRESET_LABELS, type PeriodPreset } from "@/lib/period";

const PRESETS = PERIOD_PRESETS.filter((p) => p !== "custom");

export function PeriodSelect({
  preset,
  from,
  to,
}: {
  preset: PeriodPreset;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(preset === "custom");
  const [f, setF] = useState(from ?? "");
  const [t, setT] = useState(to ?? "");

  function go(next: URLSearchParams) {
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  function pick(p: PeriodPreset) {
    setCustomOpen(false);
    const next = new URLSearchParams(params);
    next.delete("from");
    next.delete("to");
    if (p === "last_12_months") next.delete("period");
    else next.set("period", p);
    go(next);
  }

  function applyCustom() {
    if (!f || !t || t <= f) return;
    const next = new URLSearchParams(params);
    next.set("period", "custom");
    next.set("from", f);
    next.set("to", t);
    go(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <div className="flex flex-wrap items-center gap-1 rounded-[var(--radius-sm)] border border-hairline bg-surface p-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => pick(p)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
              preset === p
                ? "bg-surface-sunken text-ink"
                : "text-ink-3 hover:text-ink-2",
            )}
          >
            {PERIOD_PRESET_LABELS[p]}
          </button>
        ))}
        <button
          onClick={() => setCustomOpen((v) => !v)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
            preset === "custom"
              ? "bg-surface-sunken text-ink"
              : "text-ink-3 hover:text-ink-2",
          )}
        >
          Custom…
        </button>
      </div>

      {customOpen && (
        <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline bg-surface px-2 py-1.5">
          <input
            type="date"
            value={f}
            onChange={(e) => setF(e.target.value)}
            className="rounded-md border border-hairline-strong bg-surface px-2 py-1 text-[12.5px] outline-none focus:border-accent"
          />
          <span className="text-ink-3">–</span>
          <input
            type="date"
            value={t}
            onChange={(e) => setT(e.target.value)}
            className="rounded-md border border-hairline-strong bg-surface px-2 py-1 text-[12.5px] outline-none focus:border-accent"
          />
          <button
            onClick={applyCustom}
            disabled={!f || !t || t <= f}
            className="rounded-md bg-accent px-2.5 py-1 text-[12.5px] font-medium text-white hover:bg-accent-strong disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
