import { prisma } from "@/lib/prisma";
import { calculateProjectProfit } from "@/lib/profit";
import { allocateOverhead, type OverheadMethod } from "@/lib/overhead";
import { resolveAgencyOverhead } from "@/lib/queries/overhead";
import { cacheAgencyRead } from "@/lib/cache";
import { formatCurrency } from "@/lib/format";
import { displayInvoiceStatus, isOutstanding } from "@/lib/invoice-status";
import {
  SERVICE_COLORS,
  SERVICE_LABELS,
  type ClientGrowthBar,
  type DashboardView,
  type InvoiceRowView,
  type ProfitPoint,
} from "@/lib/dashboard-types";

/* ------------------------------------------------------------------ *
 * Normalized inputs — the pure builder below works off these so it
 * can be unit-tested without a database.
 * ------------------------------------------------------------------ */

export interface DashProjectInput {
  id: string;
  name: string;
  status: string;
  serviceType: string;
  contractValue: number;
  teamCost: number;
  allocatedOverhead: number;
  createdAt: Date;
  startDate: Date | null;
  deadline: Date | null;
  clientName: string;
  expenses: { amount: number; date: Date }[];
}

export interface DashInvoiceInput {
  id: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  status: string;
  dueDate: Date;
  clientName: string;
}

export interface DashInputs {
  projects: DashProjectInput[];
  invoices: DashInvoiceInput[]; // newest first
  payments: { amount: number; date: Date }[]; // last 30 days
  clients: { createdAt: Date }[]; // last 6 months
  monthlyRevenueTarget: number;
  overheadMethod: string;
  overheadRate: number; // fraction 0..1
  overheadMonthlyPool: number;
  greetingName: string;
  now: Date;
}

/* ------------------------------------------------------------------ */

const money = (v: number) => formatCurrency(v);

function pctChange(current: number, previous: number) {
  if (previous <= 0) return undefined;
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    direction: change >= 0 ? ("up" as const) : ("down" as const),
  };
}

function ceilCurrency(v: number) {
  if (v <= 0) return 1000;
  return Math.ceil((v * 1.12) / 500) * 500;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export function buildDashboardView(input: DashInputs): DashboardView {
  const { projects, invoices, payments, clients, greetingName, now } = input;

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // month-to-date comparison uses the SAME day-of-month window last month
  const prevMonthSameDay = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const windowStart = new Date(now);
  windowStart.setDate(now.getDate() - 29);
  windowStart.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // ---- overhead allocation (agency rule → per project) ----
  const overheadMap = allocateOverhead(
    {
      method: (input.overheadMethod as OverheadMethod) ?? "manual",
      percentRate: input.overheadRate,
    },
    input.overheadMonthlyPool,
    projects.map((p) => ({
      id: p.id,
      status: p.status,
      contractValue: p.contractValue,
      startDate: p.startDate,
      deadline: p.deadline,
      overrideOverhead: p.allocatedOverhead,
    })),
  );

  // ---- per-project profit ----
  const withProfit = projects.map((p) => ({
    project: p,
    ...calculateProjectProfit({
      contractValue: p.contractValue,
      teamCost: p.teamCost,
      allocatedOverhead: overheadMap.get(p.id) ?? 0,
      expenses: p.expenses.map((e) => ({ amount: e.amount })),
    }),
  }));
  const active = withProfit.filter((x) => x.project.status === "active");

  // ---- KPIs ----
  const revenueMtd = payments
    .filter((p) => p.date >= monthStart)
    .reduce((s, p) => s + p.amount, 0);
  const revenuePrev = payments
    .filter((p) => p.date >= prevMonthStart && p.date < prevMonthSameDay)
    .reduce((s, p) => s + p.amount, 0);
  const avgMargin =
    active.length > 0
      ? active.reduce((s, x) => s + x.profitMargin, 0) / active.length
      : 0;
  const invoiceViews = invoices.map((i) => ({
    ...i,
    display: displayInvoiceStatus(i.status, i.dueDate, i.amount, i.amountPaid, now),
    balance: Math.max(0, i.amount - i.amountPaid),
  }));
  const outstanding = invoiceViews
    .filter((i) => isOutstanding(i.display))
    .reduce((s, i) => s + i.balance, 0);
  const newThisMonth = projects.filter((p) => p.createdAt >= monthStart).length;

  const targetPct =
    input.monthlyRevenueTarget > 0
      ? (revenueMtd / input.monthlyRevenueTarget) * 100
      : 0;

  const kpis: DashboardView["kpis"] = [
    {
      id: "revenue",
      label: "Revenue (MTD)",
      value: money(revenueMtd),
      delta: pctChange(revenueMtd, revenuePrev),
      icon: "trending-up",
      hint:
        input.monthlyRevenueTarget > 0
          ? `${targetPct.toFixed(0)}% of ${money(input.monthlyRevenueTarget)} target`
          : undefined,
      progress:
        input.monthlyRevenueTarget > 0
          ? Math.min(100, targetPct)
          : undefined,
    },
    {
      id: "projects",
      label: "Active Projects",
      value: String(active.length),
      delta:
        newThisMonth > 0
          ? { value: `+${newThisMonth}`, direction: "up" }
          : undefined,
      icon: "briefcase",
    },
    {
      id: "margin",
      label: "Avg. Profit Margin",
      value: `${avgMargin.toFixed(1)}%`,
      icon: "percent",
    },
    { id: "outstanding", label: "Outstanding", value: money(outstanding), icon: "clock" },
  ];

  // ---- profit series: rolling 7-day totals sampled every ~2.5 days ----
  // Revenue = payments received in the window. Cost = project expenses in the
  // window + each active project's team cost amortised linearly across its
  // start→deadline span (fallback 90 days).
  const BUCKETS = 12;
  const bucketDays = 30 / BUCKETS;
  const TRAIL_MS = 7 * 24 * 3600 * 1000;
  const DAY_MS = 24 * 3600 * 1000;

  const expenseEvents = projects.flatMap((p) =>
    p.expenses.map((e) => ({ date: e.date, amount: e.amount })),
  );
  const sumIn = <T extends { date: Date; amount: number }>(
    rows: T[],
    from: Date,
    to: Date,
  ) => rows.filter((r) => r.date >= from && r.date < to).reduce((s, r) => s + r.amount, 0);

  const spanDays = (p: DashProjectInput) =>
    p.startDate && p.deadline
      ? Math.min(
          365,
          Math.max(7, (p.deadline.getTime() - p.startDate.getTime()) / DAY_MS),
        )
      : 90;
  const openProjects = projects.filter((p) => p.status !== "closed");
  const totalDailyLabour = openProjects
    .filter((p) => p.teamCost > 0)
    .reduce((s, p) => s + p.teamCost / spanDays(p), 0);
  // allocated overhead is a whole-project figure — amortise it across the
  // same span as team cost so the chart's cost line stays consistent.
  const totalDailyOverhead = openProjects.reduce(
    (s, p) => s + (overheadMap.get(p.id) ?? 0) / spanDays(p),
    0,
  );

  const points: ProfitPoint[] = [];
  for (let b = 1; b <= BUCKETS; b++) {
    const end = new Date(windowStart);
    end.setDate(windowStart.getDate() + Math.round(b * bucketDays));
    const from = new Date(Math.max(windowStart.getTime(), end.getTime() - TRAIL_MS));
    const windowDays = (end.getTime() - from.getTime()) / DAY_MS;

    const revenue = sumIn(
      payments.map((p) => ({ date: p.date, amount: p.amount })),
      from,
      end,
    );
    const cost =
      sumIn(expenseEvents, from, end) +
      (totalDailyLabour + totalDailyOverhead) * windowDays;

    points.push({
      label: end.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      revenue: Math.round(revenue),
      cost: Math.round(cost),
      profit: Math.round(revenue - cost),
    });
  }
  const yMax = ceilCurrency(
    Math.max(1, ...points.flatMap((p) => [p.revenue, p.cost, Math.max(0, p.profit)])),
  );

  // ---- service mix (share of contract value) ----
  const byService = new Map<string, number>();
  for (const p of projects) {
    byService.set(p.serviceType, (byService.get(p.serviceType) ?? 0) + p.contractValue);
  }
  const serviceTotal = [...byService.values()].reduce((s, v) => s + v, 0);
  const services =
    serviceTotal > 0
      ? [...byService.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, SERVICE_COLORS.length)
          .map(([type, value], i) => ({
            label: SERVICE_LABELS[type] ?? type,
            value: Math.round((value / serviceTotal) * 100),
            color: SERVICE_COLORS[i],
          }))
      : [];

  // ---- top projects by margin ----
  const topProjects = [...active]
    .filter((x) => x.project.contractValue > 0)
    .sort((a, b) => b.profitMargin - a.profitMargin)
    .slice(0, 3)
    .map((x) => ({
      name: x.project.name,
      client: x.project.clientName,
      margin: Number(x.profitMargin.toFixed(1)),
      contract: money(x.project.contractValue),
      profit: money(x.profit),
    }));

  // ---- client growth (6 months) ----
  const growth = new Map<string, number>();
  for (const c of clients) growth.set(monthKey(c.createdAt), (growth.get(monthKey(c.createdAt)) ?? 0) + 1);
  const bars: ClientGrowthBar[] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    bars.push({
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      value: growth.get(monthKey(d)) ?? 0,
      highlight: m === 0,
    });
  }
  const clientGrowth = {
    bars,
    yMax: Math.max(2, Math.ceil(Math.max(...bars.map((b) => b.value)) * 1.05)),
    netNew: bars.reduce((s, b) => s + b.value, 0),
    caption: `Net new clients per month, ${bars[0].label} to ${bars[bars.length - 1].label}.`,
  };

  // ---- recent invoices ----
  const recentInvoices: InvoiceRowView[] = invoiceViews.slice(0, 5).map((i) => ({
    id: i.id,
    number: i.invoiceNumber,
    client: i.clientName,
    status: i.display,
    amount: money(i.amount),
  }));

  // ---- insights ----
  const insights: DashboardView["insights"] = [];
  const underMargin = [...active]
    .filter((x) => x.project.contractValue > 0 && x.profitMargin < 15)
    .sort((a, b) => a.profitMargin - b.profitMargin)[0];
  if (underMargin) {
    insights.push({
      title: `${underMargin.project.name} is trending under margin`,
      body: `Projected margin is ${underMargin.profitMargin.toFixed(0)}% on a ${money(
        underMargin.project.contractValue,
      )} contract.`,
      icon: "alert-triangle",
    });
  }
  const stale = invoiceViews.filter(
    (i) => isOutstanding(i.display) && i.dueDate < thirtyDaysAgo,
  );
  if (stale.length > 0) {
    const total = stale.reduce((s, i) => s + i.balance, 0);
    const names = [...new Set(stale.map((i) => i.clientName))].slice(0, 2);
    insights.push({
      title: `${stale.length} invoice${stale.length > 1 ? "s" : ""} worth ${money(
        total,
      )} unpaid past 30 days`,
      body: `${names.join(" and ")}. Consider a reminder before month-end close.`,
      icon: "file-text",
    });
  }
  if (insights.length === 0) {
    insights.push({
      title: "Everything is on track",
      body: "No projects under 15% margin and no receivables overdue past 30 days.",
      icon: "file-text",
    });
  }

  return {
    greetingName,
    isDemo: false,
    isEmpty: projects.length === 0 && invoices.length === 0,
    kpis,
    profit: { points, yMax, tickIndices: [0, 2, 4, 6, 8, 10, 11] },
    services,
    topProjects,
    clientGrowth,
    recentInvoices,
    insights,
  };
}

/* ------------------------------------------------------------------ *
 * DB fetch + adapt to the pure builder.
 * ------------------------------------------------------------------ */

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export async function getDashboardData(
  agencyId: string,
  greetingName: string,
): Promise<DashboardView> {
  const view = await getDashboardDataCached(agencyId);
  return { ...view, greetingName: greetingName || "there" };
}

const getDashboardDataCached = cacheAgencyRead(
  fetchDashboardData,
  ["dashboard-data"],
  45,
);

export async function fetchDashboardData(
  agencyId: string,
): Promise<DashboardView> {
  const now = new Date();
  // fetch payments back to the start of last month so month-over-month works
  const paymentsSince = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [projects, invoices, payments, clients, agency, overhead] =
    await Promise.all([
    prisma.project.findMany({
      where: { agencyId },
      select: {
        id: true,
        name: true,
        status: true,
        serviceType: true,
        contractValue: true,
        teamCost: true,
        allocatedOverhead: true,
        createdAt: true,
        startDate: true,
        deadline: true,
        client: { select: { name: true } },
        projectExpenses: { select: { amount: true, dateIncurred: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        status: true,
        dueDate: true,
        client: { select: { name: true } },
        payments: { select: { amount: true } },
      },
    }),
    prisma.payment.findMany({
      where: { invoice: { agencyId }, paymentDate: { gte: paymentsSince } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.client.findMany({
      where: { agencyId, createdAt: { gte: sixMonthsStart } },
      select: { createdAt: true },
    }),
    prisma.agency.findUnique({
      where: { id: agencyId },
      select: { monthlyRevenueTarget: true },
    }),
    resolveAgencyOverhead(agencyId),
  ]);

  return buildDashboardView({
    greetingName: "",
    now,
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      serviceType: p.serviceType,
      contractValue: num(p.contractValue),
      teamCost: num(p.teamCost),
      allocatedOverhead: num(p.allocatedOverhead),
      createdAt: p.createdAt,
      startDate: p.startDate,
      deadline: p.deadline,
      clientName: p.client.name,
      expenses: p.projectExpenses.map((e) => ({
        amount: num(e.amount),
        date: e.dateIncurred,
      })),
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      amount: num(i.amount),
      amountPaid: i.payments.reduce((s, p) => s + num(p.amount), 0),
      status: i.status,
      dueDate: i.dueDate,
      clientName: i.client.name,
    })),
    payments: payments.map((p) => ({
      amount: num(p.amount),
      date: p.paymentDate,
    })),
    clients,
    monthlyRevenueTarget: num(agency?.monthlyRevenueTarget),
    overheadMethod: overhead.method,
    overheadRate: overhead.percentRate,
    overheadMonthlyPool: overhead.monthlyPool,
  });
}
