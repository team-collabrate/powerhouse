import { prisma } from "@/lib/prisma";
import { cacheAgencyRead } from "@/lib/cache";
import { resolveAgencyOverhead } from "@/lib/queries/overhead";
import { displayInvoiceStatus, isOutstanding } from "@/lib/invoice-status";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/queries/invoices";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from "@/lib/queries/expenses";
import {
  COMPANY_EXPENSE_CATEGORY_LABELS,
  type CompanyExpenseCategory,
} from "@/lib/queries/settings";
import {
  resolvePeriod,
  eachBucket,
  type PeriodInput,
} from "@/lib/period";
import {
  buildProfitability,
  serviceMixByContract,
  type MonthlyPoint,
  type ProfitabilityRow,
  type ServiceMixSlice,
} from "@/lib/queries/analytics";
import type { OverheadMethod } from "@/lib/overhead";
import {
  buildPeriodSummary,
  type PeriodSummary,
} from "@/lib/reports/period-summary";
import {
  buildPaymentMethodMix,
  type PaymentMethodSlice,
} from "@/lib/reports/payment-methods";
import {
  buildGstByQuarter,
  buildGstSummary,
  type GstQuarterRow,
  type GstSummary,
} from "@/lib/reports/gst";
import { buildAgingBuckets, type AgingResult } from "@/lib/reports/aging";
import { buildDso, type DsoResult } from "@/lib/reports/dso";
import {
  buildExpenseByCategory,
  buildCompanyExpenseTrend,
  type ExpenseByCategory,
  type ExpenseTrendPoint,
} from "@/lib/reports/expense-categories";
import {
  buildClientRanking,
  type ClientRanking,
} from "@/lib/reports/client-ranking";
import { getMilestoneRollup, type MilestoneRollup } from "@/lib/queries/milestone-rollup";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export interface ReportResult {
  period: {
    preset: string;
    label: string;
    prevLabel: string;
    from: string; // ISO
    to: string; // ISO
  };
  summary: PeriodSummary;
  cashflow: MonthlyPoint[];
  profitability: ProfitabilityRow[];
  serviceMix: ServiceMixSlice[];
  overhead: { method: OverheadMethod; methodLabel: string; monthlyPool: number };
  paymentMethods: (PaymentMethodSlice & { label: string })[];
  gst: { byQuarter: GstQuarterRow[]; summary: GstSummary };
  aging: AgingResult;
  dso: DsoResult;
  expenses: LabelledExpenses;
  companyExpenseTrend: ExpenseTrendPoint[];
  clients: ClientRanking;
  milestones: MilestoneRollup;
}

interface LabelledExpenses {
  project: (ExpenseByCategory["project"][number] & { label: string })[];
  company: (ExpenseByCategory["company"][number] & { label: string })[];
  projectTotal: number;
  companyTotal: number;
}

const methodLabel = (m: string) =>
  PAYMENT_METHOD_LABELS[m as PaymentMethod] ?? m;
const projExpenseLabel = (c: string) =>
  EXPENSE_CATEGORY_LABELS[c as ExpenseCategory] ?? c;
const companyExpenseLabel = (c: string) =>
  COMPANY_EXPENSE_CATEGORY_LABELS[c as CompanyExpenseCategory] ?? c;

export async function getReport(
  agencyId: string,
  period: PeriodInput,
): Promise<ReportResult> {
  return getReportCached(agencyId, period);
}

const getReportCached = cacheAgencyRead(fetchReport, ["report"], 60);

export async function fetchReport(
  agencyId: string,
  periodInput: PeriodInput,
): Promise<ReportResult> {
  const now = new Date();
  const p = resolvePeriod(periodInput, now);
  const { from, to } = p;
  const scanFrom = p.prev.from; // covers current + prior window

  const [
    invoices,
    projExpenses,
    companyExpenses,
    projects,
    clients,
    milestones,
    overhead,
  ] = await Promise.all([
      prisma.invoice.findMany({
        where: { agencyId },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          taxRatePct: true,
          status: true,
          issueDate: true,
          dueDate: true,
          paidDate: true,
          clientId: true,
          client: { select: { name: true } },
          payments: {
            select: { amount: true, paymentDate: true, paymentMethod: true },
          },
        },
      }),
      prisma.projectExpense.findMany({
        where: { project: { agencyId }, dateIncurred: { gte: scanFrom } },
        select: { amount: true, dateIncurred: true, category: true },
      }),
      prisma.companyExpense.findMany({
        where: { agencyId, dateIncurred: { gte: scanFrom } },
        select: { amount: true, dateIncurred: true, category: true },
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
          progressPercentage: true,
          client: { select: { name: true } },
          projectExpenses: { select: { amount: true } },
        },
      }),
      prisma.client.findMany({
        where: { agencyId },
        select: {
          id: true,
          companyName: true,
          name: true,
          projects: { select: { contractValue: true } },
        },
      }),
      getMilestoneRollup(agencyId, { from, to }),
      resolveAgencyOverhead(agencyId),
    ]);

  // ---- flatten payments (with the owning client) ----
  const allPayments = invoices.flatMap((i) =>
    i.payments.map((pay) => ({
      amount: num(pay.amount),
      date: pay.paymentDate,
      method: pay.paymentMethod || "other",
      clientId: i.clientId,
    })),
  );

  const projExpenseRows = projExpenses.map((e) => ({
    amount: num(e.amount),
    date: e.dateIncurred,
    category: e.category,
  }));
  const companyExpenseRows = companyExpenses.map((e) => ({
    amount: num(e.amount),
    date: e.dateIncurred,
    category: e.category,
  }));

  // ---- period summary (cash view: payments vs dated spend) ----
  const totalsFor = (a: Date, b: Date) => {
    const revenue = allPayments
      .filter((x) => x.date >= a && x.date < b)
      .reduce((s, x) => s + x.amount, 0);
    const cost =
      [...projExpenseRows, ...companyExpenseRows]
        .filter((x) => x.date >= a && x.date < b)
        .reduce((s, x) => s + x.amount, 0);
    return { revenue, cost };
  };
  const summary = buildPeriodSummary(
    totalsFor(from, to),
    totalsFor(p.prev.from, p.prev.to),
  );

  // ---- cash-flow series over the current window ----
  const cashflow: MonthlyPoint[] = eachBucket(from, to, p.bucket).map((b) => {
    const revenue = allPayments
      .filter((x) => x.date >= b.start && x.date < b.end)
      .reduce((s, x) => s + x.amount, 0);
    const cost = [...projExpenseRows, ...companyExpenseRows]
      .filter((x) => x.date >= b.start && x.date < b.end)
      .reduce((s, x) => s + x.amount, 0);
    return {
      label: b.label,
      revenue: Math.round(revenue),
      cost: Math.round(cost),
      net: Math.round(revenue - cost),
    };
  });

  // ---- profitability + service mix (whole-project, not period-scoped) ----
  const profitability = buildProfitability(
    projects.map((pr) => ({
      id: pr.id,
      name: pr.name,
      clientName: pr.client.name,
      status: pr.status,
      serviceType: pr.serviceType,
      contractValue: num(pr.contractValue),
      teamCost: num(pr.teamCost),
      progressPercentage: pr.progressPercentage,
      expenses: pr.projectExpenses.map((e) => num(e.amount)),
    })),
    (id) => overhead.overheadFor(id),
  );
  const serviceMix = serviceMixByContract(profitability);

  // ---- invoice-derived reports ----
  const invForReports = invoices.map((i) => {
    const amount = num(i.amount);
    const paid = i.payments.reduce((s, pay) => s + num(pay.amount), 0);
    return {
      invoiceNumber: i.invoiceNumber,
      amount,
      taxRatePct: num(i.taxRatePct),
      status: i.status,
      issueDate: i.issueDate,
      dueDate: i.dueDate,
      paidDate: i.paidDate,
      balance: Math.max(0, amount - paid),
      displayStatus: displayInvoiceStatus(i.status, i.dueDate, amount, paid, now),
      clientName: i.client.name,
    };
  });

  const aging = buildAgingBuckets(
    invForReports.map((i) => ({
      balance: i.balance,
      dueDate: i.dueDate,
      displayStatus: i.displayStatus,
      clientName: i.clientName,
    })),
    now,
  );
  const dso = buildDso(
    invForReports.map((i) => ({
      invoiceNumber: i.invoiceNumber,
      issueDate: i.issueDate,
      paidDate: i.paidDate,
      amount: i.amount,
    })),
    from,
    to,
  );
  const gst = {
    byQuarter: buildGstByQuarter(
      invForReports.map((i) => ({
        issueDate: i.issueDate,
        amount: i.amount,
        taxRatePct: i.taxRatePct,
        status: i.status,
      })),
    ),
    summary: buildGstSummary(
      invForReports.map((i) => ({
        issueDate: i.issueDate,
        amount: i.amount,
        taxRatePct: i.taxRatePct,
        status: i.status,
      })),
      from,
      to,
    ),
  };

  // ---- expenses by category + company trend ----
  const rawExpenses = buildExpenseByCategory(
    projExpenseRows,
    companyExpenseRows,
    from,
    to,
  );
  const expenses: LabelledExpenses = {
    project: rawExpenses.project.map((s) => ({
      ...s,
      label: projExpenseLabel(s.category),
    })),
    company: rawExpenses.company.map((s) => ({
      ...s,
      label: companyExpenseLabel(s.category),
    })),
    projectTotal: rawExpenses.projectTotal,
    companyTotal: rawExpenses.companyTotal,
  };
  const companyExpenseTrend = buildCompanyExpenseTrend(
    companyExpenseRows,
    from,
    to,
    p.bucket,
  );

  // ---- client revenue concentration ----
  const paidInPeriodByClient = new Map<string, number>();
  for (const pay of allPayments) {
    if (pay.date >= from && pay.date < to) {
      paidInPeriodByClient.set(
        pay.clientId,
        (paidInPeriodByClient.get(pay.clientId) ?? 0) + pay.amount,
      );
    }
  }
  const outstandingByClientId = new Map<string, number>();
  for (const i of invoices) {
    const amount = num(i.amount);
    const paid = i.payments.reduce((s, pay) => s + num(pay.amount), 0);
    const disp = displayInvoiceStatus(i.status, i.dueDate, amount, paid, now);
    if (isOutstanding(disp)) {
      outstandingByClientId.set(
        i.clientId,
        (outstandingByClientId.get(i.clientId) ?? 0) + Math.max(0, amount - paid),
      );
    }
  }
  const clientRanking = buildClientRanking(
    clients.map((c) => ({
      id: c.id,
      name: c.companyName ?? c.name,
      paidInPeriod: paidInPeriodByClient.get(c.id) ?? 0,
      outstanding: outstandingByClientId.get(c.id) ?? 0,
      lifetimeValue: c.projects.reduce((s, pr) => s + num(pr.contractValue), 0),
    })),
  );

  return {
    period: {
      preset: p.preset,
      label: p.label,
      prevLabel: p.prev.label,
      from: from.toISOString(),
      to: to.toISOString(),
    },
    summary,
    cashflow,
    profitability,
    serviceMix,
    overhead: {
      method: overhead.method,
      methodLabel: overhead.methodLabel,
      monthlyPool: overhead.monthlyPool,
    },
    paymentMethods: buildPaymentMethodMix(
      allPayments.map((x) => ({ method: x.method, amount: x.amount, date: x.date })),
      from,
      to,
    ).map((s) => ({ ...s, label: methodLabel(s.method) })),
    gst,
    aging,
    dso,
    expenses,
    companyExpenseTrend,
    clients: clientRanking,
    milestones,
  };
}
