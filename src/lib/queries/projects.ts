import { prisma } from "@/lib/prisma";
import { calculateProjectProfit } from "@/lib/profit";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export const PROJECT_STATUSES = [
  "active",
  "in_review",
  "delivered",
  "closed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const SERVICE_TYPES = [
  "web_dev",
  "design",
  "marketing",
  "consulting",
  "other",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  web_dev: "Web Development",
  design: "Brand & Design",
  marketing: "Marketing",
  consulting: "Consulting",
  other: "Other",
};

export interface ProjectListItem {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  serviceType: ServiceType;
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
  const rows = await prisma.project.findMany({
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
  });

  const all: ProjectListItem[] = rows.map((p) => {
    const profit = calculateProjectProfit({
      contractValue: num(p.contractValue),
      teamCost: num(p.teamCost),
      allocatedOverhead: num(p.allocatedOverhead),
      expenses: p.projectExpenses.map((e) => ({ amount: num(e.amount) })),
    });
    return {
      id: p.id,
      name: p.name,
      clientName: p.client.name,
      status: p.status as ProjectStatus,
      serviceType: p.serviceType as ServiceType,
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
  serviceType: ServiceType;
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
  }[];
  milestones: {
    id: string;
    name: string;
    status: string;
    dueDate: string;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
    dueDate: string;
  }[];
}

export async function getProject(
  agencyId: string,
  id: string,
): Promise<ProjectDetail | null> {
  const p = await prisma.project.findFirst({
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
        },
      },
      milestones: {
        orderBy: { dueDate: "asc" },
        select: { id: true, name: true, status: true, dueDate: true },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          dueDate: true,
        },
      },
    },
  });
  if (!p) return null;

  const expenses = p.projectExpenses.map((e) => ({
    id: e.id,
    category: e.category,
    amount: num(e.amount),
    description: e.description,
    dateIncurred: e.dateIncurred.toISOString(),
  }));

  const profit = calculateProjectProfit({
    contractValue: num(p.contractValue),
    teamCost: num(p.teamCost),
    allocatedOverhead: num(p.allocatedOverhead),
    expenses: expenses.map((e) => ({ amount: e.amount })),
  });

  return {
    id: p.id,
    name: p.name,
    description: p.description,
    clientId: p.clientId,
    clientName: p.client.name,
    status: p.status as ProjectStatus,
    serviceType: p.serviceType as ServiceType,
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
      overhead: num(p.allocatedOverhead),
      total: profit.totalCost,
      profit: profit.profit,
      profitMargin: profit.profitMargin,
    },
    expenses,
    milestones: p.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
      dueDate: m.dueDate.toISOString(),
    })),
    invoices: p.invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      amount: num(i.amount),
      status: i.status,
      dueDate: i.dueDate.toISOString(),
    })),
  };
}
