import { prisma } from "@/lib/prisma";
import { calculateProjectProfit } from "@/lib/profit";
import { allocateOverhead, type OverheadMethod } from "@/lib/overhead";
import { resolveAgencyOverhead } from "@/lib/queries/overhead";
import { fetchServices } from "@/lib/queries/services";
import { cacheAgencyRead } from "@/lib/cache";
import { formatCurrency } from "@/lib/format";
import { displayInvoiceStatus, isOutstanding } from "@/lib/invoice-status";
import {
  type ClientGrowthBar,
  type DashboardView,
  type InvoiceRowView,
  type ProfitPoint,
} from "@/lib/dashboard-types";
import { serviceLabel, type ServiceLite } from "@/lib/services";
import { accentShadeRamp, DEFAULT_ACCENT } from "@/lib/color";
import {
  buildMilestoneRollup,
  type MilestoneRollupInput,
} from "@/lib/reports/milestone-rollup";

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
  progressPercentage: number;
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
  payments: { amount: number; date: Date }[]; // all-time
  clients: { createdAt: Date }[]; // last 6 months
  milestones: MilestoneRollupInput[];
  services: ServiceLite[];
  /** the agency's own accent colour — shades the service-mix donut */
  brandColor: string;
  monthlyRevenueTarget: number;
  overheadMethod: string;
  overheadRate: number; // fraction 0..1
  overheadMonthlyPool: number;
  greetingName: string;
  now: Date;
}

/* ------------------------------------------------------------------ */

const money = (v: number) => formatCurrency(v);

function ceilCurrency(v: number) {
  if (v <= 0) return 1000;
  return Math.ceil((v * 1.12) / 500) * 500;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export function buildDashboardView(input: DashInputs): DashboardView {
  const { projects, invoices, payments, clients, greetingName, now } = input;

  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
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
  const nonClosed = withProfit.filter((x) => x.project.status !== "closed");
  const activeProjects = nonClosed.filter(
    (x) => x.project.status === "active",
  );
  const activeCount = activeProjects.length;
  // contract-value-weighted mean completion across active projects
  const activeContract = activeProjects.reduce(
    (s, x) => s + Math.max(0, x.project.contractValue),
    0,
  );
  const deliveryProgress =
    activeContract > 0
      ? Math.round(
          activeProjects.reduce(
            (s, x) =>
              s + Math.max(0, x.project.contractValue) * x.project.progressPercentage,
            0,
          ) / activeContract,
        )
      : activeCount > 0
        ? Math.round(
            activeProjects.reduce((s, x) => s + x.project.progressPercentage, 0) /
              activeCount,
          )
        : 0;

  // ---- KPIs (all-time / year-to-date — this is a low-volume, project-based
  // business, so a monthly view reads as mostly zeros) ----
  const revenueAllTime = payments.reduce((s, p) => s + p.amount, 0);
  const revenueThisYear = payments
    .filter((p) => p.date >= yearStart)
    .reduce((s, p) => s + p.amount, 0);

  // portfolio margin = Σ profit / Σ contract across every open project
  const marginBase = nonClosed.filter((x) => x.project.contractValue > 0);
  const portfolioContract = marginBase.reduce(
    (s, x) => s + x.project.contractValue,
    0,
  );
  const portfolioProfit = marginBase.reduce((s, x) => s + x.profit, 0);
  const portfolioMargin =
    portfolioContract > 0 ? (portfolioProfit / portfolioContract) * 100 : 0;

  const invoiceViews = invoices.map((i) => ({
    ...i,
    display: displayInvoiceStatus(i.status, i.dueDate, i.amount, i.amountPaid, now),
    balance: Math.max(0, i.amount - i.amountPaid),
  }));
  const outstanding = invoiceViews
    .filter((i) => isOutstanding(i.display))
    .reduce((s, i) => s + i.balance, 0);
  const newThisYear = projects.filter((p) => p.createdAt >= yearStart).length;

  const annualTarget = input.monthlyRevenueTarget * 12;
  const targetPct =
    annualTarget > 0 ? (revenueThisYear / annualTarget) * 100 : 0;

  const kpis: DashboardView["kpis"] = [
    {
      id: "revenue",
      label: "Revenue (all-time)",
      value: money(revenueAllTime),
      icon: "trending-up",
      hint:
        annualTarget > 0
          ? `${money(revenueThisYear)} in ${year} · ${targetPct.toFixed(0)}% of target`
          : `${money(revenueThisYear)} received in ${year}`,
      progress: annualTarget > 0 ? Math.min(100, targetPct) : undefined,
    },
    {
      id: "projects",
      label: "Projects",
      value: String(nonClosed.length),
      delta:
        newThisYear > 0
          ? { value: `+${newThisYear}`, direction: "up" }
          : undefined,
      icon: "briefcase",
      hint:
        activeCount > 0
          ? `${activeCount} in progress · ${deliveryProgress}% done`
          : "all delivered",
    },
    {
      id: "margin",
      label: "Profit Margin",
      value: `${portfolioMargin.toFixed(1)}%`,
      icon: "percent",
    },
    { id: "outstanding", label: "Outstanding", value: money(outstanding), icon: "clock" },
  ];

  // ---- profit series: the trailing 12 calendar months ----
  // Revenue = payments received that month. Cost = project expenses that month
  // + each open project's (team cost + allocated overhead) amortised linearly
  // across its active span and attributed to the months it overlaps.
  const DAY_MS = 24 * 3600 * 1000;

  const expenseEvents = projects.flatMap((p) =>
    p.expenses.map((e) => ({ date: e.date, amount: e.amount })),
  );
  const sumIn = <T extends { date: Date; amount: number }>(
    rows: T[],
    from: Date,
    to: Date,
  ) => rows.filter((r) => r.date >= from && r.date < to).reduce((s, r) => s + r.amount, 0);

  const costSpans = projects
    .filter((p) => p.status !== "closed")
    .map((p) => {
      const total = p.teamCost + (overheadMap.get(p.id) ?? 0);
      let from: Date;
      let to: Date;
      if (p.startDate && p.deadline && p.deadline > p.startDate) {
        from = p.startDate;
        to = p.deadline;
      } else if (p.startDate) {
        from = p.startDate;
        to = new Date(p.startDate.getTime() + 90 * DAY_MS);
      } else {
        to = now;
        from = new Date(now.getTime() - 90 * DAY_MS);
      }
      const spanDays = Math.min(
        365,
        Math.max(7, (to.getTime() - from.getTime()) / DAY_MS),
      );
      return { from, to, dailyCost: total / spanDays };
    });

  const overlapDays = (aFrom: Date, aTo: Date, bFrom: Date, bTo: Date) => {
    const lo = Math.max(aFrom.getTime(), bFrom.getTime());
    const hi = Math.min(aTo.getTime(), bTo.getTime());
    return hi > lo ? (hi - lo) / DAY_MS : 0;
  };

  const points: ProfitPoint[] = [];
  for (let m = 11; m >= 0; m--) {
    const mStart = new Date(year, now.getMonth() - m, 1);
    const mEnd = new Date(year, now.getMonth() - m + 1, 1);

    const revenue = sumIn(
      payments.map((p) => ({ date: p.date, amount: p.amount })),
      mStart,
      mEnd,
    );
    // don't recognise cost past today — the current month is still partial
    const mCap = mEnd > now ? now : mEnd;
    const amortised = costSpans.reduce(
      (s, c) => s + c.dailyCost * overlapDays(c.from, c.to, mStart, mCap),
      0,
    );
    const cost = sumIn(expenseEvents, mStart, mEnd) + amortised;

    points.push({
      label: mStart.toLocaleDateString("en-IN", {
        month: "short",
        year: mStart.getMonth() === 0 || m === 11 ? "2-digit" : undefined,
      }),
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
  const rankedServices = [...byService.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const shades = accentShadeRamp(input.brandColor, rankedServices.length);
  const services =
    serviceTotal > 0
      ? rankedServices.map(([type, value], i) => ({
          label: serviceLabel(input.services, type),
          value: Math.round((value / serviceTotal) * 100),
          // shaded by rank from the agency's own accent colour (dark→light)
          // — one hue for the donut, not each service's own tag colour
          // (that stays on project rows/tags)
          color: shades[i],
        }))
      : [];

  // ---- top projects by margin ----
  const topProjects = [...nonClosed]
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
  const underMargin = [...nonClosed]
    .filter(
      (x) =>
        x.project.status !== "delivered" &&
        x.project.contractValue > 0 &&
        x.profitMargin < 15,
    )
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

  // ---- upcoming deliverables (cross-project milestones) ----
  const rollup = buildMilestoneRollup(input.milestones, now);
  const deliverables = {
    overdue: rollup.overdue.slice(0, 5).map(pickDeliverable),
    upcoming: rollup.upcoming.slice(0, 6).map(pickDeliverable),
  };

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
    deliverables,
  };
}

function pickDeliverable(r: {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  daysAway: number;
}) {
  return {
    id: r.id,
    name: r.name,
    projectId: r.projectId,
    projectName: r.projectName,
    daysAway: r.daysAway,
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
  // the dashboard is all-time / trailing-12-months, so pull every payment
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    projects,
    invoices,
    payments,
    clients,
    milestones,
    agency,
    services,
    overhead,
  ] = await Promise.all([
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
        progressPercentage: true,
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
      where: { invoice: { agencyId } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.client.findMany({
      where: { agencyId, createdAt: { gte: sixMonthsStart } },
      select: { createdAt: true },
    }),
    prisma.milestone.findMany({
      where: { project: { agencyId } },
      select: {
        id: true,
        name: true,
        status: true,
        dueDate: true,
        completedDate: true,
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.agency.findUnique({
      where: { id: agencyId },
      select: { monthlyRevenueTarget: true, brandColor: true },
    }),
    fetchServices(agencyId),
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
      progressPercentage: p.progressPercentage,
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
    services,
    milestones: milestones.map((m) => ({
      id: m.id,
      name: m.name,
      projectId: m.project.id,
      projectName: m.project.name,
      status: m.status,
      dueDate: m.dueDate,
      completedDate: m.completedDate,
    })),
    brandColor: agency?.brandColor ?? DEFAULT_ACCENT,
    monthlyRevenueTarget: num(agency?.monthlyRevenueTarget),
    overheadMethod: overhead.method,
    overheadRate: overhead.percentRate,
    overheadMonthlyPool: overhead.monthlyPool,
  });
}
