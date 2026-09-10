import { eachBucket, type Bucket } from "@/lib/period";
import { inRange, round0, round1, sum } from "./shared";

export interface CategorizedExpense {
  category: string;
  amount: number;
  date: Date;
}

export interface CategorySlice {
  category: string;
  amount: number;
  pct: number;
  count: number;
}

function rollup(rows: CategorizedExpense[]): CategorySlice[] {
  const total = sum(rows.map((r) => r.amount));
  const byCat = new Map<string, { amount: number; count: number }>();
  for (const r of rows) {
    const v = byCat.get(r.category) ?? { amount: 0, count: 0 };
    v.amount += r.amount;
    v.count += 1;
    byCat.set(r.category, v);
  }
  return [...byCat.entries()]
    .map(([category, v]) => ({
      category,
      amount: round0(v.amount),
      count: v.count,
      pct: total > 0 ? round1((v.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface ExpenseByCategory {
  project: CategorySlice[];
  company: CategorySlice[];
  projectTotal: number;
  companyTotal: number;
}

export function buildExpenseByCategory(
  projectExpenses: CategorizedExpense[],
  companyExpenses: CategorizedExpense[],
  from: Date,
  to: Date,
): ExpenseByCategory {
  const p = inRange(projectExpenses, from, to);
  const c = inRange(companyExpenses, from, to);
  return {
    project: rollup(p),
    company: rollup(c),
    projectTotal: round0(sum(p.map((r) => r.amount))),
    companyTotal: round0(sum(c.map((r) => r.amount))),
  };
}

export interface ExpenseTrendPoint {
  label: string;
  total: number;
  byCategory: Record<string, number>;
}

/** Company-expense totals per time bucket across [from, to). */
export function buildCompanyExpenseTrend(
  rows: CategorizedExpense[],
  from: Date,
  to: Date,
  bucket: Bucket,
): ExpenseTrendPoint[] {
  return eachBucket(from, to, bucket).map((b) => {
    const slice = rows.filter((r) => r.date >= b.start && r.date < b.end);
    const byCategory: Record<string, number> = {};
    for (const r of slice) {
      byCategory[r.category] = round0((byCategory[r.category] ?? 0) + r.amount);
    }
    return {
      label: b.label,
      total: round0(sum(slice.map((r) => r.amount))),
      byCategory,
    };
  });
}
