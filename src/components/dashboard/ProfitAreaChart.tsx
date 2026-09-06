"use client";

import { useMemo, useRef, useState } from "react";
import { PROFIT_SERIES } from "@/lib/demo-data";

const W = 720;
const H = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 44 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const { revenue, cost, profit, yMax, ticks, days } = {
  ...PROFIT_SERIES,
  profit: PROFIT_SERIES.profit,
};

function x(i: number, n: number) {
  return PAD.left + (i / (n - 1)) * PLOT_W;
}
function y(v: number) {
  return PAD.top + PLOT_H - (v / yMax) * PLOT_H;
}
function path(data: number[]) {
  return data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i, data.length)},${y(v)}`).join(" ");
}

const gridValues = [0, 2000, 4000, 6000];

export function ProfitAreaChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const n = revenue.length;

  const areaPath = useMemo(
    () => `${path(profit)} L${x(n - 1, n)},${y(0)} L${x(0, n)},${y(0)} Z`,
    [n],
  );

  function onMove(e: React.PointerEvent) {
    const rect = wrapRef.current!.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const svgX = ratio * W;
    const idx = Math.round(((svgX - PAD.left) / PLOT_W) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  }

  const hx = hover !== null ? (x(hover, n) / W) * 100 : 0;

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
                {v === 0 ? "0" : `${v / 1000}k`}
              </text>
            </g>
          ))}

          <path d={areaPath} fill="url(#profitFill)" />

          <path
            d={path(cost)}
            fill="none"
            stroke="var(--ink-3)"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={path(revenue)}
            fill="none"
            stroke="var(--ink-2)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={path(profit)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {ticks.map((t, i) => (
            <text
              key={t}
              x={PAD.left + (i / (ticks.length - 1)) * PLOT_W}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
              fontSize={10}
              fill="var(--ink-3)"
            >
              {t}
            </text>
          ))}

          {hover !== null && (
            <g>
              <line
                x1={x(hover, n)}
                x2={x(hover, n)}
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
                  cx={x(hover, n)}
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
            style={{ left: `${hx}%` }}
          >
            <p className="text-[11px] font-medium text-ink-3">{days[hover]}</p>
            <dl className="mt-1 space-y-0.5">
              <Row label="Revenue" value={revenue[hover]} color="var(--ink-2)" />
              <Row label="Cost" value={cost[hover]} color="var(--ink-3)" />
              <Row label="Profit" value={profit[hover]} color="var(--accent)" strong />
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
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color }}
        />
        {label}
      </span>
      <span
        className={`tnum ml-auto ${strong ? "font-semibold text-ink" : "text-ink-2"}`}
      >
        ${value.toLocaleString()}
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
