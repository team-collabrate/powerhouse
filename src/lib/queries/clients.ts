import { prisma } from "@/lib/prisma";
import { calculateProjectProfit } from "@/lib/profit";
import { resolveAgencyOverhead } from "@/lib/queries/overhead";
import { displayInvoiceStatus, isOutstanding } from "@/lib/invoice-status";
import type { InvoiceStatus } from "@/lib/dashboard-types";
import type { ProjectStatus } from "@/lib/queries/projects";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export interface ClientListItem {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  isActive: boolean;
  projectCount: number;
  lifetimeValue: number; // Σ contract value
  outstanding: number; // Σ open invoice balances
  /** share of total lifetime value across all clients, % */
  valuePct: number;
}

export interface ClientListResult {
  items: ClientListItem[];
  activeCount: number;
  inactiveCount: number;
  /** biggest client's share of total lifetime value, % */
  top1Pct: number;
  top3Pct: number;
}

export async function listClients(
  agencyId: string,
  filters: { q?: string; includeInactive?: boolean } = {},
): Promise<ClientListResult> {
  const now = new Date();
  const rows = await prisma.client.findMany({
    where: { agencyId },
    orderBy: { companyName: "asc" },
    select: {
      id: true,
      companyName: true,
      name: true,
      email: true,
      isActive: true,
      projects: { select: { contractValue: true } },
      invoices: {
        select: {
          amount: true,
          status: true,
          dueDate: true,
          payments: { select: { amount: true } },
        },
      },
    },
  });

  const all: ClientListItem[] = rows.map((c) => {
    const lifetimeValue = c.projects.reduce(
      (s, p) => s + num(p.contractValue),
      0,
    );
    const outstanding = c.invoices.reduce((s, i) => {
      const amount = num(i.amount);
      const paid = i.payments.reduce((t, p) => t + num(p.amount), 0);
      const display = displayInvoiceStatus(i.status, i.dueDate, amount, paid, now);
      return isOutstanding(display) ? s + Math.max(0, amount - paid) : s;
    }, 0);
    return {
      id: c.id,
      companyName: c.companyName ?? c.name,
      contactName: c.name,
      email: c.email,
      isActive: c.isActive,
      projectCount: c.projects.length,
      lifetimeValue,
      outstanding,
      valuePct: 0,
    };
  });

  all.sort((a, b) => b.lifetimeValue - a.lifetimeValue);
  const totalValue = all.reduce((s, c) => s + c.lifetimeValue, 0);
  for (const c of all) {
    c.valuePct =
      totalValue > 0
        ? Math.round((c.lifetimeValue / totalValue) * 1000) / 10
        : 0;
  }
  const top1Pct = all[0]?.valuePct ?? 0;
  const top3Pct =
    Math.round(all.slice(0, 3).reduce((s, c) => s + c.valuePct, 0) * 10) / 10;

  const activeCount = all.filter((c) => c.isActive).length;
  const inactiveCount = all.length - activeCount;

  const q = filters.q?.trim().toLowerCase();
  const items = all.filter((c) => {
    if (!filters.includeInactive && !c.isActive) return false;
    if (
      q &&
      !`${c.companyName} ${c.contactName} ${c.email}`.toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  return { items, activeCount, inactiveCount, top1Pct, top3Pct };
}

export interface ClientDetail {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  isActive: boolean;
  portalToken: string | null;
  createdAt: string;
  finance: {
    lifetimeValue: number;
    invoiced: number;
    paid: number;
    outstanding: number;
  };
  projects: {
    id: string;
    name: string;
    status: ProjectStatus;
    contractValue: number;
    profit: number;
    profitMargin: number;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    amount: number;
    balance: number;
    dueDate: string;
  }[];
}

export async function getClient(
  agencyId: string,
  id: string,
): Promise<ClientDetail | null> {
  const now = new Date();
  const [c, overhead] = await Promise.all([
    prisma.client.findFirst({
    where: { id, agencyId },
    select: {
      id: true,
      companyName: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      isActive: true,
      portalToken: true,
      createdAt: true,
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          contractValue: true,
          teamCost: true,
          allocatedOverhead: true,
          projectExpenses: { select: { amount: true } },
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
  ]);
  if (!c) return null;

  const projects = c.projects.map((p) => {
    const pr = calculateProjectProfit({
      contractValue: num(p.contractValue),
      teamCost: num(p.teamCost),
      allocatedOverhead: overhead.overheadFor(p.id),
      expenses: p.projectExpenses.map((e) => ({ amount: num(e.amount) })),
    });
    return {
      id: p.id,
      name: p.name,
      status: p.status as ProjectStatus,
      contractValue: num(p.contractValue),
      profit: pr.profit,
      profitMargin: pr.profitMargin,
    };
  });

  const invoices = c.invoices.map((i) => {
    const amount = num(i.amount);
    const paid = i.payments.reduce((s, p) => s + num(p.amount), 0);
    return {
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      status: displayInvoiceStatus(i.status, i.dueDate, amount, paid, now),
      amount,
      balance: Math.max(0, amount - paid),
      dueDate: i.dueDate.toISOString(),
    };
  });

  const lifetimeValue = projects.reduce((s, p) => s + p.contractValue, 0);
  const invoiced = invoices
    .filter((i) => i.status !== "cancelled" && i.status !== "draft")
    .reduce((s, i) => s + i.amount, 0);
  const paid = c.invoices.reduce(
    (s, i) => s + i.payments.reduce((t, p) => t + num(p.amount), 0),
    0,
  );
  const outstanding = invoices
    .filter((i) => isOutstanding(i.status))
    .reduce((s, i) => s + i.balance, 0);

  return {
    id: c.id,
    companyName: c.companyName ?? c.name,
    contactName: c.name,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    country: c.country,
    isActive: c.isActive,
    portalToken: c.portalToken,
    createdAt: c.createdAt.toISOString(),
    finance: { lifetimeValue, invoiced, paid, outstanding },
    projects,
    invoices,
  };
}
