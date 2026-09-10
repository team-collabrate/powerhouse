import { prisma } from "@/lib/prisma";
import { calculateProjectProfit } from "@/lib/profit";
import { resolveAgencyOverhead } from "@/lib/queries/overhead";
import { fetchServices } from "@/lib/queries/services";
import { serviceLabel, serviceColor } from "@/lib/services";
import type { MilestoneRow, MilestoneStatus } from "@/lib/queries/milestones";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/projects-shared";
import type { ProjectStatus } from "@/lib/projects-shared";

export interface ProjectListItem {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  serviceType: string;
  serviceLabel: string;
  serviceColor: string;
  contractValue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  progressPercentage: number;
  deadline: string | null;
}

export interface ProjectListResult {
  items: ProjectListItem[];
  counts: Record<"all" | ProjectStatus, number>;
}

export interface ProjectFilters {
  status?: ProjectStatus | "all";
  q?: string;
}

export async function listProjects(
  agencyId: string,
  filters: ProjectFilters = {},
): Promise<ProjectListResult> {
  const [rows, overhead, services] = await Promise.all([
    prisma.project.findMany({
      where: { agencyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        serviceType: true,
        contractValue: true,
        teamCost: true,
        allocatedOverhead: true,
        progressPercentage: true,
        deadline: true,
        client: { select: { name: true } },
        projectExpenses: { select: { amount: true } },
      },
    }),
    resolveAgencyOverhead(agencyId),
    fetchServices(agencyId),
  ]);

  const all: ProjectListItem[] = rows.map((p) => {
    const profit = calculateProjectProfit({
      contractValue: num(p.contractValue),
      teamCost: num(p.teamCost),
      allocatedOverhead: overhead.overheadFor(p.id),
      expenses: p.projectExpenses.map((e) => ({ amount: num(e.amount) })),
    });
    return {
      id: p.id,
      name: p.name,
      clientName: p.client.name,
      status: p.status as ProjectStatus,
      serviceType: p.serviceType,
      serviceLabel: serviceLabel(services, p.serviceType),
      serviceColor: serviceColor(services, p.serviceType),
      contractValue: num(p.contractValue),
      totalCost: profit.totalCost,
      profit: profit.profit,
      profitMargin: profit.profitMargin,
      progressPercentage: p.progressPercentage,
      deadline: p.deadline ? p.deadline.toISOString() : null,
    };
  });

  const counts = {
    all: all.length,
    active: all.filter((p) => p.status === "active").length,
    in_review: all.filter((p) => p.status === "in_review").length,
    delivered: all.filter((p) => p.status === "delivered").length,
    closed: all.filter((p) => p.status === "closed").length,
  };

  const q = filters.q?.trim().toLowerCase();
  const items = all.filter((p) => {
    if (filters.status && filters.status !== "all" && p.status !== filters.status)
      return false;
    if (q && !`${p.name} ${p.clientName}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return { items, counts };
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  serviceType: string;
  serviceLabel: string;
  contractValue: number;
  teamCost: number;
  allocatedOverhead: number;
  startDate: string | null;
  deadline: string | null;
  progressPercentage: number;
  createdAt: string;
  cost: {
    teamCost: number;
    expenses: number;
    overhead: number;
    overheadSource: "pinned" | "rule" | "none";
    total: number;
    profit: number;
    profitMargin: number;
  };
  expenses: {
    id: string;
    category: string;
    amount: number;
    description: string;
    dateIncurred: string;
    receiptUrl: string | null;
  }[];
  milestones: MilestoneRow[];
  invoices: {
    id: string;
    invoiceNumber: string;
    amount: number;
    amountPaid: number;
    rawStatus: string;
    dueDate: string;
  }[];
}

export async function getProject(
  agencyId: string,
  id: string,
): Promise<ProjectDetail | null> {
  const [p, overhead, services] = await Promise.all([
    prisma.project.findFirst({
    where: { id, agencyId },
    select: {
      id: true,
      name: true,
      description: true,
      clientId: true,
      status: true,
      serviceType: true,
      contractValue: true,
      teamCost: true,
      allocatedOverhead: true,
      startDate: true,
      deadline: true,
      progressPercentage: true,
      createdAt: true,
      client: { select: { name: true } },
      projectExpenses: {
        orderBy: { dateIncurred: "desc" },
        select: {
          id: true,
          category: true,
          amount: true,
          description: true,
          dateIncurred: true,
          receiptUrl: true,
        },
      },
      milestones: {
        orderBy: { dueDate: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          dueDate: true,
          completedDate: true,
        },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          dueDate: true,
          payments: { select: { amount: true } },
        },
      },
    },
    }),
    resolveAgencyOverhead(agencyId),
    fetchServices(agencyId),
  ]);
  if (!p) return null;

  const allocatedOverhead = overhead.overheadFor(p.id);
  const overheadSource: "pinned" | "rule" | "none" =
    num(p.allocatedOverhead) > 0
      ? "pinned"
      : overhead.method === "manual"
        ? "none"
        : "rule";

  const expenses = p.projectExpenses.map((e) => ({
    id: e.id,
    category: e.category,
    amount: num(e.amount),
    description: e.description,
    dateIncurred: e.dateIncurred.toISOString(),
    receiptUrl: e.receiptUrl,
  }));

  const profit = calculateProjectProfit({
    contractValue: num(p.contractValue),
    teamCost: num(p.teamCost),
    allocatedOverhead,
    expenses: expenses.map((e) => ({ amount: e.amount })),
  });

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    clientId: p.clientId,
    clientName: p.client.name,
    status: p.status as ProjectStatus,
    serviceType: p.serviceType,
    serviceLabel: serviceLabel(services, p.serviceType),
    contractValue: num(p.contractValue),
    teamCost: num(p.teamCost),
    allocatedOverhead: num(p.allocatedOverhead),
    startDate: p.startDate ? p.startDate.toISOString() : null,
    deadline: p.deadline ? p.deadline.toISOString() : null,
    progressPercentage: p.progressPercentage,
    createdAt: p.createdAt.toISOString(),
    cost: {
      teamCost: profit.totalTeamCost,
      expenses: profit.totalExpenses,
      overhead: allocatedOverhead,
      overheadSource,
      total: profit.totalCost,
      profit: profit.profit,
      profitMargin: profit.profitMargin,
    },
    expenses,
    milestones: p.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      status: m.status as MilestoneStatus,
      dueDate: m.dueDate.toISOString(),
      completedDate: m.completedDate ? m.completedDate.toISOString() : null,
    })),
    invoices: p.invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      amount: num(i.amount),
      amountPaid: i.payments.reduce((s, pay) => s + num(pay.amount), 0),
      rawStatus: i.status,
      dueDate: i.dueDate.toISOString(),
    })),
  };
}
