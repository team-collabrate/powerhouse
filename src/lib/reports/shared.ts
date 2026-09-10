/**
 * Shared helpers for the pure report builders in this directory.
 * No Prisma, no Next — every builder is unit-tested from literal inputs.
 */

export interface Totals {
  revenue: number;
  cost: number;
}

export interface Metric {
  value: number;
  prev: number;
  /** relative % change vs `prev`; null when `prev` is 0 (render as "—") */
  deltaPct: number | null;
  direction: "up" | "down" | "flat";
}

export const DAY_MS = 86_400_000;

export const round0 = (n: number) => Math.round(n);
export const round1 = (n: number) =>
  Math.round((n + Number.EPSILON) * 10) / 10;
export const sum = (ns: number[]) => ns.reduce((s, n) => s + n, 0);

export const mean = (ns: number[]) => (ns.length ? sum(ns) / ns.length : 0);

export function median(ns: number[]): number {
  if (!ns.length) return 0;
  const s = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function inRange<T extends { date: Date }>(rows: T[], from: Date, to: Date): T[] {
  return rows.filter((r) => r.date >= from && r.date < to);
}

/** A `Metric` from a current and prior scalar. */
export function metric(value: number, prev: number): Metric {
  const deltaPct =
    prev === 0 ? null : round1(((value - prev) / Math.abs(prev)) * 100);
  const direction =
    deltaPct == null || Math.abs(deltaPct) < 0.05
      ? "flat"
      : deltaPct > 0
        ? "up"
        : "down";
  return { value: round0(value), prev: round0(prev), deltaPct, direction };
}
