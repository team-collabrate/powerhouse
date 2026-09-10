/**
 * Reporting periods — pure, client-safe.
 *
 * MUST NOT import from `@/lib/prisma`, `@/lib/cache`, or `next/*`. It is
 * imported by the `"use client"` period picker, and cached query adapters
 * take a `PeriodInput` (plain strings) — never a `Date` — so the
 * `unstable_cache` key stays low-cardinality. `resolvePeriod()` runs *inside*
 * those adapters.
 *
 * Financial year is the Indian FY: 1 April → 31 March. Quarters follow it
 * (Q1 Apr–Jun, Q2 Jul–Sep, Q3 Oct–Dec, Q4 Jan–Mar).
 *
 * All dates are built with `new Date(y, m, d)` (server-local; Vercel runs
 * UTC). FY/quarter edges therefore shift a few hours from IST at edge-of-day —
 * immaterial for reporting.
 */

export const PERIOD_PRESETS = [
  "this_month",
  "last_month",
  "this_quarter",
  "last_quarter",
  "this_fy",
  "last_fy",
  "ytd",
  "last_12_months",
  "custom",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  this_month: "This month",
  last_month: "Last month",
  this_quarter: "This quarter",
  last_quarter: "Last quarter",
  this_fy: "This FY",
  last_fy: "Last FY",
  ytd: "FY to date",
  last_12_months: "Last 12 months",
  custom: "Custom",
};

export interface PeriodInput {
  preset: PeriodPreset;
  /** ISO yyyy-mm-dd — only read when preset === "custom" */
  from?: string;
  /** ISO yyyy-mm-dd, exclusive end — only read when preset === "custom" */
  to?: string;
}

export type Bucket = "day" | "week" | "month";

export interface Window {
  from: Date;
  to: Date; // half-open [from, to)
  label: string;
}

export interface ResolvedPeriod extends Window {
  preset: PeriodPreset;
  /** the comparable window immediately before `from` */
  prev: Window;
  bucket: Bucket;
  /** stable, low-cardinality cache key */
  cacheKey: string;
}

const DAY_MS = 86_400_000;
const MAX_CUSTOM_DAYS = 24 * 31; // ~24 months

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth() + n, 1);
const spanDays = (from: Date, to: Date) => (to.getTime() - from.getTime()) / DAY_MS;
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

/** FY that contains `d`: `{ start: 1 Apr, end: 1 Apr next year }` (half-open). */
export function indianFyBounds(d: Date): { start: Date; end: Date } {
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 3 ? y : y - 1;
  return { start: new Date(startYear, 3, 1), end: new Date(startYear + 1, 3, 1) };
}

/** e.g. `{ fy: "2026-27", q: "Q2", label: "Q2 FY 2026-27" }`. */
export function fyQuarterOf(d: Date): {
  fy: string;
  q: "Q1" | "Q2" | "Q3" | "Q4";
  label: string;
} {
  const startYear = indianFyBounds(d).start.getFullYear();
  const fy = `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
  const m = d.getMonth();
  const q =
    m >= 3 && m <= 5
      ? "Q1"
      : m >= 6 && m <= 8
        ? "Q2"
        : m >= 9 && m <= 11
          ? "Q3"
          : "Q4";
  return { fy, q, label: `${q} FY ${fy}` };
}

/** Start of the FY quarter that contains `d` (Q4 = Jan–Mar of the same year). */
function fyQuarterStart(d: Date): Date {
  const m = d.getMonth();
  const qStartMonth =
    m >= 3 && m <= 5 ? 3 : m >= 6 && m <= 8 ? 6 : m >= 9 ? 9 : 0;
  return new Date(d.getFullYear(), qStartMonth, 1);
}

function fyLabel(start: Date): string {
  const y = start.getFullYear();
  return `FY ${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

const monthLabel = (d: Date) =>
  d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

function rangeLabel(from: Date, to: Date): string {
  // `to` is exclusive; show the last included day. Year shown on the end date.
  const last = addDays(to, -1);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${from.toLocaleDateString("en-IN", opts)} – ${last.toLocaleDateString(
    "en-IN",
    { ...opts, year: "numeric" },
  )}`;
}

/** The window of equal length immediately before `from`. */
function priorWindow(from: Date, to: Date, kind: PeriodPreset): Window {
  if (kind === "this_month" || kind === "last_month") {
    const pf = addMonths(from, -1);
    return { from: pf, to: from, label: monthLabel(pf) };
  }
  if (kind === "this_quarter" || kind === "last_quarter") {
    const pf = addMonths(from, -3);
    return { from: pf, to: from, label: `${fyQuarterOf(pf).label}` };
  }
  if (kind === "this_fy" || kind === "last_fy") {
    const pf = new Date(from.getFullYear() - 1, 3, 1);
    return { from: pf, to: from, label: fyLabel(pf) };
  }
  if (kind === "ytd") {
    const pf = new Date(from.getFullYear() - 1, from.getMonth(), from.getDate());
    const pt = new Date(
      to.getFullYear() - 1,
      to.getMonth(),
      to.getDate(),
    );
    return { from: pf, to: pt, label: `${fyLabel(pf)} to date` };
  }
  if (kind === "last_12_months") {
    const pf = addMonths(from, -12);
    return { from: pf, to: from, label: "Previous 12 months" };
  }
  // custom / fallback: same-length window ending at `from`
  const len = to.getTime() - from.getTime();
  const pf = new Date(from.getTime() - len);
  return { from: pf, to: from, label: rangeLabel(pf, from) };
}

function bucketFor(from: Date, to: Date): Bucket {
  const days = spanDays(from, to);
  if (days <= 35) return "day";
  if (days <= 100) return "week";
  return "month";
}

export function resolvePeriod(input: PeriodInput, now: Date): ResolvedPeriod {
  const preset: PeriodPreset = PERIOD_PRESETS.includes(input.preset)
    ? input.preset
    : "last_12_months";

  let from: Date;
  let to: Date;
  let label: string;
  let cacheKey: string = preset;

  switch (preset) {
    case "this_month": {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = addMonths(from, 1);
      label = monthLabel(from);
      break;
    }
    case "last_month": {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to = addMonths(from, 1);
      label = monthLabel(from);
      break;
    }
    case "this_quarter": {
      from = fyQuarterStart(now);
      to = addMonths(from, 3);
      label = fyQuarterOf(from).label;
      break;
    }
    case "last_quarter": {
      from = addMonths(fyQuarterStart(now), -3);
      to = addMonths(from, 3);
      label = fyQuarterOf(from).label;
      break;
    }
    case "this_fy": {
      const fy = indianFyBounds(now);
      from = fy.start;
      to = fy.end;
      label = fyLabel(from);
      break;
    }
    case "last_fy": {
      const fy = indianFyBounds(now);
      from = new Date(fy.start.getFullYear() - 1, 3, 1);
      to = fy.start;
      label = fyLabel(from);
      break;
    }
    case "ytd": {
      from = indianFyBounds(now).start;
      to = addDays(startOfDay(now), 1);
      label = `${fyLabel(from)} to date`;
      break;
    }
    case "custom": {
      const f = input.from ? startOfDay(new Date(input.from)) : null;
      const t = input.to ? startOfDay(new Date(input.to)) : null;
      if (!f || !t || Number.isNaN(f.getTime()) || Number.isNaN(t.getTime()) || t <= f) {
        // invalid custom range → fall back to last 12 months
        return resolvePeriod({ preset: "last_12_months" }, now);
      }
      from = f;
      to = spanDays(f, t) > MAX_CUSTOM_DAYS ? addDays(f, MAX_CUSTOM_DAYS) : t;
      label = rangeLabel(from, to);
      cacheKey = `custom:${iso(from)}:${iso(to)}`;
      break;
    }
    case "last_12_months":
    default: {
      to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      from = addMonths(to, -12);
      label = "Last 12 months";
      break;
    }
  }

  return {
    preset,
    from,
    to,
    label,
    prev: priorWindow(from, to, preset),
    bucket: bucketFor(from, to),
    cacheKey,
  };
}

/** Ordered buckets tiling `[from, to)`. */
export function eachBucket(
  from: Date,
  to: Date,
  bucket: Bucket,
): { start: Date; end: Date; label: string }[] {
  const out: { start: Date; end: Date; label: string }[] = [];
  const spansYears = from.getFullYear() !== addDays(to, -1).getFullYear();

  if (bucket === "month") {
    let cur = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur < to) {
      const end = addMonths(cur, 1);
      out.push({
        start: cur,
        end: end > to ? to : end,
        label: cur.toLocaleDateString("en-IN", {
          month: "short",
          ...(spansYears ? { year: "2-digit" } : {}),
        }),
      });
      cur = end;
    }
    return out;
  }

  const step = bucket === "week" ? 7 : 1;
  let cur = startOfDay(from);
  while (cur < to) {
    const end = addDays(cur, step);
    out.push({
      start: cur,
      end: end > to ? to : end,
      label: cur.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    });
    cur = end;
  }
  return out;
}
