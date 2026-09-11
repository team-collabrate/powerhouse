/* ------------------------------------------------------------------ *
 * Overhead allocation: PURE. No Prisma import so `npm test` can pull
 * this in directly. The DB adapter lives in src/lib/queries/overhead.ts.
 *
 * Company overhead (the `company_expenses` table) is distributed down to
 * projects by an agency-level rule, then fed into calculateProjectProfit
 * as `allocatedOverhead`. A project whose stored `allocatedOverhead > 0`
 * pins that value verbatim (an explicit override); 0 means "use the rule".
 * ------------------------------------------------------------------ */

export const OVERHEAD_METHODS = [
  "manual",
  "percent",
  "even",
  "contract_share",
] as const;
export type OverheadMethod = (typeof OVERHEAD_METHODS)[number];

export const OVERHEAD_METHOD_LABELS: Record<OverheadMethod, string> = {
  manual: "Manual (per project)",
  percent: "Percent of contract value",
  even: "Split evenly across open projects",
  contract_share: "Weighted by contract value",
};

const DAY_MS = 24 * 3600 * 1000;

/** Recurring frequency → months-per-occurrence multiplier. */
const perMonth: Record<string, number> = {
  monthly: 1,
  quarterly: 1 / 3,
  annually: 1 / 12,
};

export interface OverheadExpenseInput {
  amount: number;
  dateIncurred: Date;
  isRecurring: boolean;
  recurringFrequency: string | null;
}

/**
 * A stable $/month overhead figure:
 *   Σ recurring items normalised to monthly run-rate
 * + one-off items from the trailing 90 days, averaged over 3 months.
 */
export function overheadMonthlyPool(
  expenses: OverheadExpenseInput[],
  now: Date,
): number {
  const trailingStart = new Date(now.getTime() - 90 * DAY_MS);

  let recurring = 0;
  let oneOff = 0;
  for (const e of expenses) {
    if (e.isRecurring && e.recurringFrequency && perMonth[e.recurringFrequency]) {
      recurring += e.amount * perMonth[e.recurringFrequency];
    } else if (!e.isRecurring && e.dateIncurred >= trailingStart) {
      oneOff += e.amount;
    }
  }
  return recurring + oneOff / 3;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/**
 * How many months a project runs, for pro-rating the monthly pool.
 * Both dates present → clamp(round((deadline - start) / 30d), 1, 18).
 * Missing either date → 3 (matches the dashboard chart's 90-day fallback).
 */
export function overheadDurationMonths(
  startDate: Date | null,
  deadline: Date | null,
): number {
  if (!startDate || !deadline) return 3;
  const months = Math.round(
    (deadline.getTime() - startDate.getTime()) / (30 * DAY_MS),
  );
  return clamp(months, 1, 18);
}

export interface OverheadProjectInput {
  id: string;
  status: string;
  contractValue: number;
  startDate: Date | null;
  deadline: Date | null;
  /** the stored Project.allocatedOverhead column: > 0 pins the value */
  overrideOverhead: number;
}

export interface OverheadConfig {
  method: OverheadMethod;
  /** fraction 0..1, used when method = percent */
  percentRate: number;
}

/**
 * Resolve each project's allocated overhead. Returns a Map keyed by project id.
 * - Pinned projects (overrideOverhead > 0) take that value under every method
 *   and are removed from the pool split (their cost is additive on top).
 * - Pool methods (even / contract_share) fund every non-closed project,
 *   pro-rated by duration in months.
 */
export function allocateOverhead(
  cfg: OverheadConfig,
  monthlyPool: number,
  projects: OverheadProjectInput[],
): Map<string, number> {
  const out = new Map<string, number>();

  const funded = projects.filter((p) => p.status !== "closed");
  const poolFunded = funded.filter((p) => !(p.overrideOverhead > 0));
  const contractDenom = poolFunded
    .filter((p) => p.contractValue > 0)
    .reduce((s, p) => s + p.contractValue, 0);
  const evenShare =
    poolFunded.length > 0 ? monthlyPool / poolFunded.length : 0;

  for (const p of projects) {
    if (p.overrideOverhead > 0) {
      out.set(p.id, p.overrideOverhead);
      continue;
    }
    if (p.status === "closed") {
      out.set(p.id, 0);
      continue;
    }

    const months = overheadDurationMonths(p.startDate, p.deadline);

    switch (cfg.method) {
      case "percent":
        out.set(p.id, Math.round(p.contractValue * cfg.percentRate));
        break;
      case "even":
        out.set(p.id, Math.round(evenShare * months));
        break;
      case "contract_share":
        out.set(
          p.id,
          contractDenom > 0 && p.contractValue > 0
            ? Math.round(
                monthlyPool * (p.contractValue / contractDenom) * months,
              )
            : 0,
        );
        break;
      case "manual":
      default:
        out.set(p.id, 0);
        break;
    }
  }

  return out;
}
