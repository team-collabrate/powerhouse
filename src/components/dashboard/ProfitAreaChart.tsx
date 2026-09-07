"use client";

import { useMemo, useRef, useState } from "react";
import type { ProfitSeriesView } from "@/lib/dashboard-types";
import { formatCurrency } from "@/lib/format";

const W = 720;
const H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 44 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function ProfitAreaChart({ series }: { series: ProfitSeriesView }) {
  const { points, yMax, tickIndices } = series;
  const n = points.length;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const revenue = points.map((p) => p.revenue);
  const cost = points.map((p) => p.cost);
  const profit = points.map((p) => p.profit);

  const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * PLOT_W);
  const y = (v: number) =>
    PAD.top + PLOT_H - (Math.max(0, v) / yMax) * PLOT_H;
  const line = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");

  const gridValues = useMemo(() => {
    const step = yMax / 3;
    return [0, step, step * 2, yMax];
  }, [yMax]);

  const areaPath = `${line(profit)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;

  function onMove(e: React.PointerEvent) {
    const rect = wrapRef.current!.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(((ratio * W - PAD.left) / PLOT_W) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  }

  const kfmt = (v: number) => {
    if (v === 0) return "0";
    if (v >= 1e7) return `${Math.round(v / 1e6) / 10}Cr`;
    if (v >= 1e5) return `${Math.round(v / 1e4) / 10}L`;
    if (v >= 1000) return `${Math.round(v / 100) / 10}k`;
    return String(Math.round(v));
  };

  return (
    <div className="px-5 pb-5 pt-4">
      <Legend />
      <div
        ref={wrapRef}
        className="relative mt-3"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 220 }}
          role="img"
          aria-label="Revenue, cost and profit over the last 30 days"
        >
          <defs>
            <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridValues.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--hairline)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={PAD.left - 10}
                y={y(v) + 3}
                textAnchor="end"
                className="tnum"
                fontSize={10}
                fill="var(--ink-3)"
              >
                {kfmt(v)}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#profitFill)" />
          <path
            d={line(cost)}
            fill="none"
            stroke="var(--ink-3)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={line(revenue)}
            fill="none"
            stroke="var(--ink-2)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={line(profit)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {tickIndices
            .filter((i) => i < n)
            .map((i) => (
              <text
                key={i}
                x={x(i)}
                y={H - 8}
                textAnchor={i === 0 ? "start" : i >= n - 1 ? "end" : "middle"}
                fontSize={10}
                fill="var(--ink-3)"
              >
                {points[i].label}
              </text>
            ))}

          {hover !== null && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke="var(--hairline-strong)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              {[
                { v: revenue[hover], c: "var(--ink-2)" },
                { v: cost[hover], c: "var(--ink-3)" },
                { v: profit[hover], c: "var(--accent)" },
              ].map((d, i) => (
                <circle
                  key={i}
                  cx={x(hover)}
                  cy={y(d.v)}
                  r={3.5}
                  fill="var(--surface)"
                  stroke={d.c}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 shadow-[var(--shadow-pop)]"
            style={{ left: `${(x(hover) / W) * 100}%` }}
          >
            <p className="text-[11px] font-medium text-ink-3">
              {points[hover].label}
            </p>
            <dl className="mt-1 space-y-0.5">
              <Row label="Revenue" value={revenue[hover]} color="var(--ink-2)" />
              <Row label="Cost" value={cost[hover]} color="var(--ink-3)" />
              <Row
                label="Profit"
                value={profit[hover]}
                color="var(--accent)"
                strong
              />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: number;
  color: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className="flex items-center gap-1.5 text-ink-3">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span
        className={`tnum ml-auto ${strong ? "font-semibold text-ink" : "text-ink-2"}`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-[12px] text-ink-2">
      {[
        { label: "Revenue", color: "var(--ink-2)", dash: false },
        { label: "Cost", color: "var(--ink-3)", dash: true },
        { label: "Profit", color: "var(--accent)", dash: false },
      ].map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <svg width={16} height={4} aria-hidden>
            <line
              x1={0}
              y1={2}
              x2={16}
              y2={2}
              stroke={l.color}
              strokeWidth={2}
              strokeDasharray={l.dash ? "3 2" : undefined}
            />
          </svg>
          {l.label}
        </span>
      ))}
    </div>
  );
}
