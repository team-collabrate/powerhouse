import { prisma } from "@/lib/prisma";
import { calculateProjectProfit } from "@/lib/profit";
import {
  SERVICE_TYPE_LABELS,
  type ProjectStatus,
  type ServiceType,
} from "@/lib/queries/projects";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export const ANALYTICS_PERIODS = [3, 6, 12] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export interface MonthlyPoint {
  label: string;
  revenue: number; // payments received
  cost: number; // project expenses + company overhead, by date
  net: number;
}

export interface ProfitabilityRow {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  serviceType: ServiceType;
  contractValue: number;
  teamCost: number;
  expenses: number;
  overhead: number;
  totalCost: number;
  profit: number;
  margin: number;
}

export interface AnalyticsResult {
  months: AnalyticsPeriod;
  monthly: MonthlyPoint[];
  summary: {
    revenue: number;
    cost: number;
    net: number;
    avgMargin: number; // across active projects, all-time
  };
  serviceMix: { label: string; value: number; amount: number }[];
  projects: ProfitabilityRow[];
}

function monthLabel(d: Date, spanYears: boolean) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    ...(spanYears ? { year: "2-digit" } : {}),
  });
}

export async function getAnalytics(
  agencyId: string,
  months: AnalyticsPeriod,
): Promise<AnalyticsResult> {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const [payments, projExpenses, companyExpenses, projects] = await Promise.all([
    prisma.payment.findMany({
      where: { invoice: { agencyId }, paymentDate: { gte: from } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.projectExpense.findMany({
      where: { project: { agencyId }, dateIncurred: { gte: from } },
      select: { amount: true, dateIncurred: true },
    }),
    prisma.companyExpense.findMany({
      where: { agencyId, dateIncurred: { gte: from } },
      select: { amount: true, dateIncurred: true },
    }),
    prisma.project.findMany({
      where: { agencyId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        status: true,
        serviceType: true,
        contractValue: true,
        teamCost: true,
        allocatedOverhead: true,
        client: { select: { name: true } },
        projectExpenses: { select: { amount: true } },
      },
    }),
  ]);

  const spanYears = from.getFullYear() !== now.getFullYear();

  const monthly: MonthlyPoint[] = [];
  for (let m = months - 1; m >= 0; m--) {
    const start = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
    const inRange = (dt: Date) => dt >= start && dt < end;

    const revenue = payments
      .filter((p) => inRange(p.paymentDate))
      .reduce((s, p) => s + num(p.amount), 0);
    const cost =
      projExpenses
        .filter((e) => inRange(e.dateIncurred))
        .reduce((s, e) => s + num(e.amount), 0) +
      companyExpenses
        .filter((e) => inRange(e.dateIncurred))
        .reduce((s, e) => s + num(e.amount), 0);

    monthly.push({
      label: monthLabel(start, spanYears),
      revenue: Math.round(revenue),
      cost: Math.round(cost),
      net: Math.round(revenue - cost),
    });
  }

  // ---- profitability ----
  const rows: ProfitabilityRow[] = projects.map((p) => {
    const pr = calculateProjectProfit({
      contractValue: num(p.contractValue),
      teamCost: num(p.teamCost),
      allocatedOverhead: num(p.allocatedOverhead),
      expenses: p.projectExpenses.map((e) => ({ amount: num(e.amount) })),
    });
    return {
      id: p.id,
      name: p.name,
      client: p.client.name,
      status: p.status as ProjectStatus,
      serviceType: p.serviceType as ServiceType,
      contractValue: num(p.contractValue),
      teamCost: num(p.teamCost),
      expenses: pr.totalExpenses,
      overhead: num(p.allocatedOverhead),
      totalCost: pr.totalCost,
      profit: pr.profit,
      margin: Number(pr.profitMargin.toFixed(1)),
    };
  });
  rows.sort((a, b) => b.margin - a.margin);

  const activeRows = rows.filter((r) => r.status === "active");
  const avgMargin =
    activeRows.length > 0
      ? activeRows.reduce((s, r) => s + r.margin, 0) / activeRows.length
      : 0;

  // ---- service mix (by contract value) ----
  const byService = new Map<string, number>();
  for (const r of rows) {
    byService.set(r.serviceType, (byService.get(r.serviceType) ?? 0) + r.contractValue);
  }
  const serviceTotal = [...byService.values()].reduce((s, v) => s + v, 0);
  const serviceMix =
    serviceTotal > 0
      ? [...byService.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([type, amount]) => ({
            label: SERVICE_TYPE_LABELS[type as ServiceType] ?? type,
            amount,
            value: Math.round((amount / serviceTotal) * 100),
          }))
      : [];

  const revenueTotal = monthly.reduce((s, m) => s + m.revenue, 0);
  const costTotal = monthly.reduce((s, m) => s + m.cost, 0);

  return {
    months,
    monthly,
    summary: {
      revenue: revenueTotal,
      cost: costTotal,
      net: revenueTotal - costTotal,
      avgMargin,
    },
    serviceMix,
    projects: rows,
  };
}

export function profitabilityCsv(rows: ProfitabilityRow[]): string {
  const head = [
    "Project",
    "Client",
    "Status",
    "Service",
    "Contract",
    "Team cost",
    "Expenses",
    "Overhead",
    "Total cost",
    "Profit",
    "Margin %",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.client,
      r.status,
      SERVICE_TYPE_LABELS[r.serviceType] ?? r.serviceType,
      r.contractValue,
      r.teamCost,
      r.expenses,
      r.overhead,
      r.totalCost,
      r.profit,
      r.margin,
    ]
      .map((v) => {
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
