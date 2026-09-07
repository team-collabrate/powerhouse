import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import {
  overheadMonthlyPool,
  OVERHEAD_METHODS,
  type OverheadMethod,
} from "@/lib/overhead";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export interface AgencySettings {
  id: string;
  name: string;
  logoUrl: string | null;
  brandColor: string;
  monthlyRevenueTarget: number;
  overheadMethod: OverheadMethod;
  overheadRatePct: number; // 0..100 for the UI
}

export async function getAgencySettings(
  agencyId: string,
): Promise<AgencySettings | null> {
  const a = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      brandColor: true,
      monthlyRevenueTarget: true,
      overheadMethod: true,
      overheadRate: true,
    },
  });
  if (!a) return null;
  const method = OVERHEAD_METHODS.includes(a.overheadMethod as OverheadMethod)
    ? (a.overheadMethod as OverheadMethod)
    : "manual";
  return {
    id: a.id,
    name: a.name,
    logoUrl: a.logoUrl,
    brandColor: a.brandColor,
    monthlyRevenueTarget: num(a.monthlyRevenueTarget),
    overheadMethod: method,
    overheadRatePct: num(a.overheadRate) * 100,
  };
}

export const COMPANY_EXPENSE_CATEGORIES = [
  "rent",
  "utilities",
  "salary",
  "software",
  "insurance",
  "other",
] as const;
export type CompanyExpenseCategory =
  (typeof COMPANY_EXPENSE_CATEGORIES)[number];

export const COMPANY_EXPENSE_CATEGORY_LABELS: Record<
  CompanyExpenseCategory,
  string
> = {
  rent: "Rent",
  utilities: "Utilities",
  salary: "Salary",
  software: "Software",
  insurance: "Insurance",
  other: "Other",
};

export const RECURRING_FREQUENCIES = [
  "monthly",
  "quarterly",
  "annually",
] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export interface CompanyExpenseRow {
  id: string;
  category: CompanyExpenseCategory;
  description: string;
  amount: number;
  dateIncurred: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
}

export interface CompanyExpenseListResult {
  items: CompanyExpenseRow[];
  /** normalised monthly run-rate of the recurring items */
  monthlyRecurring: number;
  /** total booked in the trailing calendar month */
  lastMonthTotal: number;
  /** the pool the overhead allocation rule distributes: recurring run-rate + trailing-90d one-offs / 3 */
  monthlyPool: number;
}

const perMonth: Record<RecurringFrequency, number> = {
  monthly: 1,
  quarterly: 1 / 3,
  annually: 1 / 12,
};

export async function listCompanyExpenses(
  agencyId: string,
): Promise<CompanyExpenseListResult> {
  const rows = await prisma.companyExpense.findMany({
    where: { agencyId },
    orderBy: { dateIncurred: "desc" },
    select: {
      id: true,
      category: true,
      description: true,
      amount: true,
      dateIncurred: true,
      isRecurring: true,
      recurringFrequency: true,
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const items: CompanyExpenseRow[] = rows.map((r) => ({
    id: r.id,
    category: r.category as CompanyExpenseCategory,
    description: r.description,
    amount: num(r.amount),
    dateIncurred: r.dateIncurred.toISOString(),
    isRecurring: r.isRecurring,
    recurringFrequency: (r.recurringFrequency as RecurringFrequency) ?? null,
  }));

  const monthlyRecurring = items
    .filter((i) => i.isRecurring && i.recurringFrequency)
    .reduce((s, i) => s + i.amount * perMonth[i.recurringFrequency!], 0);

  const lastMonthTotal = rows
    .filter((r) => r.dateIncurred >= monthStart && r.dateIncurred < monthEnd)
    .reduce((s, r) => s + num(r.amount), 0);

  const monthlyPool = overheadMonthlyPool(
    rows.map((r) => ({
      amount: num(r.amount),
      dateIncurred: r.dateIncurred,
      isRecurring: r.isRecurring,
      recurringFrequency: r.recurringFrequency,
    })),
    now,
  );

  return { items, monthlyRecurring, lastMonthTotal, monthlyPool };
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  roleLabel: string;
  isActive: boolean;
  isYou: boolean;
}

export async function listTeamMembers(
  agencyId: string,
  currentUserId: string,
): Promise<TeamMember[]> {
  const users = await prisma.user.findMany({
    where: { agencyId },
    orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
  return users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    roleLabel: ROLE_LABELS[u.role as Role] ?? u.role,
    isActive: u.isActive,
    isYou: u.id === currentUserId,
  }));
}

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  roleLabel: string;
  token: string;
  createdAt: string;
}

export async function listInvites(agencyId: string): Promise<PendingInvite[]> {
  const rows = await prisma.invite.findMany({
    where: { agencyId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, token: true, createdAt: true },
  });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    roleLabel: ROLE_LABELS[r.role as Role] ?? r.role,
    token: r.token,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** For the "can't remove the last admin" guard. */
export async function countActiveAdmins(agencyId: string): Promise<number> {
  return prisma.user.count({
    where: { agencyId, role: "admin", isActive: true },
  });
}
