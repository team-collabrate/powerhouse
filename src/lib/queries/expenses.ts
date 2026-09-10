import { prisma } from "@/lib/prisma";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export const EXPENSE_CATEGORIES = [
  "freelance",
  "software",
  "design",
  "hosting",
  "travel",
  "materials",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  freelance: "Freelance",
  software: "Software",
  design: "Design",
  hosting: "Hosting",
  travel: "Travel",
  materials: "Materials",
  other: "Other",
};

export interface ExpenseRow {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  dateIncurred: string;
  receiptUrl: string | null;
}

export interface ExpenseCategorySlice {
  category: ExpenseCategory;
  label: string;
  amount: number;
  count: number;
  pct: number;
}

export interface ExpenseListResult {
  items: ExpenseRow[];
  total: number;
  /** the filtered rows rolled up by category, biggest first */
  byCategory: ExpenseCategorySlice[];
  projects: { id: string; name: string }[];
}

export interface ExpenseFilters {
  projectId?: string;
  category?: ExpenseCategory;
}

export async function listExpenses(
  agencyId: string,
  filters: ExpenseFilters = {},
): Promise<ExpenseListResult> {
  const [rows, projects] = await Promise.all([
    prisma.projectExpense.findMany({
      where: {
        project: { agencyId },
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      },
      orderBy: { dateIncurred: "desc" },
      select: {
        id: true,
        projectId: true,
        category: true,
        amount: true,
        description: true,
        dateIncurred: true,
        receiptUrl: true,
        project: {
          select: { name: true, client: { select: { name: true } } },
        },
      },
    }),
    prisma.project.findMany({
      where: { agencyId, status: { not: "closed" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const items: ExpenseRow[] = rows.map((e) => ({
    id: e.id,
    projectId: e.projectId,
    projectName: e.project.name,
    clientName: e.project.client.name,
    category: e.category as ExpenseCategory,
    amount: num(e.amount),
    description: e.description,
    dateIncurred: e.dateIncurred.toISOString(),
    receiptUrl: e.receiptUrl,
  }));

  const total = items.reduce((s, e) => s + e.amount, 0);

  const catMap = new Map<ExpenseCategory, { amount: number; count: number }>();
  for (const e of items) {
    const v = catMap.get(e.category) ?? { amount: 0, count: 0 };
    v.amount += e.amount;
    v.count += 1;
    catMap.set(e.category, v);
  }
  const byCategory: ExpenseCategorySlice[] = [...catMap.entries()]
    .map(([category, v]) => ({
      category,
      label: EXPENSE_CATEGORY_LABELS[category] ?? category,
      amount: Math.round(v.amount),
      count: v.count,
      pct: total > 0 ? Math.round((v.amount / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { items, total, byCategory, projects };
}
