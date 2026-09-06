"use client";

import { useState } from "react";
import type { MonthlyPoint } from "@/lib/queries/analytics";
import { formatCurrency } from "@/lib/format";

export function CashFlowChart({ data }: { data: MonthlyPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const rawMax = Math.max(1000, ...data.flatMap((d) => [d.revenue, d.cost]));
  const yMax = Math.ceil((rawMax * 1.08) / 5000) * 5000;
  const grid = [1, 0.5, 0]; // fractions of yMax, top→bottom

  return (
    <div className="px-5 pb-5 pt-4">
      <div className="flex items-center gap-4 text-[12px] text-ink-2">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-accent" /> Money in
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-hairline-strong" /> Money out
        </span>
      </div>

      <div className="relative mt-4 pl-10">
        {/* gridlines + y labels */}
        <div className="absolute inset-y-0 left-0 right-0">
          {grid.map((g) => (
            <div
              key={g}
              className="absolute left-0 right-0 flex items-center"
              style={{ top: `${(1 - g) * 100}%` }}
            >
              <span className="tnum w-9 pr-1 text-right text-[10px] text-ink-3">
                {g === 0 ? "0" : `${Math.round((yMax * g) / 1000)}k`}
              </span>
              <span className="h-px flex-1 bg-hairline" />
            </div>
          ))}
        </div>

        <div className="relative flex h-[180px] items-end gap-2">
          {data.map((d, i) => (
            <div
              key={i}
              className="relative flex h-full flex-1 items-end justify-center gap-1"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <div
                className="w-full max-w-[16px] rounded-[3px] bg-accent"
                style={{ height: `${Math.max(1, (d.revenue / yMax) * 100)}%` }}
              />
              <div
                className="w-full max-w-[16px] rounded-[3px] bg-hairline-strong"
                style={{ height: `${Math.max(1, (d.cost / yMax) * 100)}%` }}
              />

              {hover === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 shadow-[var(--shadow-pop)]">
                  <p className="text-[11px] font-medium text-ink-3">{d.label}</p>
                  <dl className="mt-1 space-y-0.5 text-[12px]">
                    <Row label="In" value={d.revenue} />
                    <Row label="Out" value={d.cost} muted />
                    <Row label="Net" value={d.net} net />
                  </dl>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-1.5 flex gap-2">
          {data.map((d, i) => (
            <span key={i} className="flex-1 text-center text-[10px] text-ink-3">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  net,
}: {
  label: string;
  value: number;
  muted?: boolean;
  net?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-ink-3">{label}</span>
      <span
        className={`tnum ml-auto ${
          net
            ? value >= 0
              ? "font-semibold text-profit"
              : "font-semibold text-loss"
            : muted
              ? "text-ink-2"
              : "font-medium text-ink"
        }`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
