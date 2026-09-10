import { prisma } from "@/lib/prisma";
import { displayInvoiceStatus, isOutstanding } from "@/lib/invoice-status";
import { invoiceTotals } from "@/lib/invoice-total";
import type { InvoiceStatus } from "@/lib/dashboard-types";

export interface InvoiceLineItemRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type { InvoiceStatus };

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export const PAYMENT_METHODS = [
  "bank_transfer",
  "card",
  "cheque",
  "cash",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: "Bank transfer",
  card: "Card",
  cheque: "Cheque",
  cash: "Cash",
  other: "Other",
};

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  projectId: string;
  projectName: string;
  amount: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string;
}

type StatusKey = "all" | InvoiceStatus;

export interface InvoiceListResult {
  items: InvoiceListItem[];
  counts: Record<StatusKey, number>;
  outstandingTotal: number;
  overdueTotal: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus | "all";
  q?: string;
}

function toListItem(
  e: {
    id: string;
    invoiceNumber: string;
    amount: unknown;
    status: string;
    issueDate: Date | null;
    dueDate: Date;
    projectId: string;
    client: { name: string };
    project: { name: string };
    payments: { amount: unknown }[];
  },
  now: Date,
): InvoiceListItem {
  const amount = num(e.amount);
  const amountPaid = e.payments.reduce((s, p) => s + num(p.amount), 0);
  return {
    id: e.id,
    invoiceNumber: e.invoiceNumber,
    clientName: e.client.name,
    projectId: e.projectId,
    projectName: e.project.name,
    amount,
    amountPaid,
    balance: Math.max(0, amount - amountPaid),
    status: displayInvoiceStatus(e.status, e.dueDate, amount, amountPaid, now),
    issueDate: e.issueDate ? e.issueDate.toISOString() : null,
    dueDate: e.dueDate.toISOString(),
  };
}

export async function listInvoices(
  agencyId: string,
  filters: InvoiceFilters = {},
): Promise<InvoiceListResult> {
  const now = new Date();
  const rows = await prisma.invoice.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      status: true,
      issueDate: true,
      dueDate: true,
      projectId: true,
      client: { select: { name: true } },
      project: { select: { name: true } },
      payments: { select: { amount: true } },
    },
  });

  const all = rows.map((r) => toListItem(r, now));

  const counts: Record<StatusKey, number> = {
    all: all.length,
    draft: 0,
    sent: 0,
    partial: 0,
    overdue: 0,
    paid: 0,
    cancelled: 0,
  };
  for (const i of all) counts[i.status]++;

  const q = filters.q?.trim().toLowerCase();
  const items = all.filter((i) => {
    if (filters.status && filters.status !== "all" && i.status !== filters.status)
      return false;
    if (
      q &&
      !`${i.invoiceNumber} ${i.clientName} ${i.projectName}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });

  return {
    items,
    counts,
    outstandingTotal: all
      .filter((i) => isOutstanding(i.status))
      .reduce((s, i) => s + i.balance, 0),
    overdueTotal: all
      .filter((i) => i.status === "overdue")
      .reduce((s, i) => s + i.balance, 0),
  };
}

export interface InvoiceDetail extends InvoiceListItem {
  clientId: string;
  notes: string | null;
  sentDate: string | null;
  viewedDate: string | null;
  paidDate: string | null;
  createdAt: string;
  taxRatePct: number;
  subtotal: number;
  tax: number;
  lineItems: InvoiceLineItemRow[];
  payments: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    referenceNumber: string | null;
    notes: string | null;
    recordedBy: string;
  }[];
}

export async function getInvoice(
  agencyId: string,
  id: string,
): Promise<InvoiceDetail | null> {
  const now = new Date();
  const e = await prisma.invoice.findFirst({
    where: { id, agencyId },
    select: {
      id: true,
      invoiceNumber: true,
      amount: true,
      taxRatePct: true,
      status: true,
      issueDate: true,
      dueDate: true,
      sentDate: true,
      viewedDate: true,
      paidDate: true,
      notes: true,
      createdAt: true,
      projectId: true,
      clientId: true,
      client: { select: { name: true } },
      project: { select: { name: true } },
      lineItems: {
        orderBy: { position: "asc" },
        select: { id: true, description: true, quantity: true, unitPrice: true },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        select: {
          id: true,
          amount: true,
          paymentDate: true,
          paymentMethod: true,
          referenceNumber: true,
          notes: true,
          recordedBy: true,
        },
      },
    },
  });
  if (!e) return null;

  const list = toListItem(e, now);
  const lineItems: InvoiceLineItemRow[] = e.lineItems.map((li) => ({
    id: li.id,
    description: li.description,
    quantity: num(li.quantity),
    unitPrice: num(li.unitPrice),
  }));
  const taxRatePct = num(e.taxRatePct);
  const t = invoiceTotals(lineItems, taxRatePct);
  return {
    ...list,
    clientId: e.clientId,
    notes: e.notes,
    sentDate: e.sentDate ? e.sentDate.toISOString() : null,
    viewedDate: e.viewedDate ? e.viewedDate.toISOString() : null,
    paidDate: e.paidDate ? e.paidDate.toISOString() : null,
    createdAt: e.createdAt.toISOString(),
    taxRatePct,
    subtotal: t.subtotal,
    tax: t.tax,
    lineItems,
    payments: e.payments.map((p) => ({
      id: p.id,
      amount: num(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod,
      referenceNumber: p.referenceNumber,
      notes: p.notes,
      recordedBy: p.recordedBy,
    })),
  };
}

export interface InvoicePrintData {
  agency: { name: string; logoUrl: string | null; brandColor: string };
  client: {
    companyName: string;
    contactName: string;
    email: string;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zipCode: string | null;
  };
  invoiceNumber: string;
  projectName: string;
  lineItems: InvoiceLineItemRow[];
  subtotal: number;
  taxRatePct: number;
  tax: number;
  amount: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string;
  notes: string | null;
}

export async function getInvoicePrintData(
  agencyId: string,
  id: string,
): Promise<InvoicePrintData | null> {
  const now = new Date();
  const e = await prisma.invoice.findFirst({
    where: { id, agencyId },
    select: {
      invoiceNumber: true,
      amount: true,
      taxRatePct: true,
      status: true,
      issueDate: true,
      dueDate: true,
      notes: true,
      agency: { select: { name: true, logoUrl: true, brandColor: true } },
      project: { select: { name: true } },
      lineItems: {
        orderBy: { position: "asc" },
        select: { id: true, description: true, quantity: true, unitPrice: true },
      },
      client: {
        select: {
          name: true,
          companyName: true,
          email: true,
          address: true,
          city: true,
          state: true,
          country: true,
          zipCode: true,
        },
      },
      payments: { select: { amount: true } },
    },
  });
  if (!e) return null;

  const amount = num(e.amount);
  const amountPaid = e.payments.reduce((s, p) => s + num(p.amount), 0);
  const lineItems: InvoiceLineItemRow[] = e.lineItems.map((li) => ({
    id: li.id,
    description: li.description,
    quantity: num(li.quantity),
    unitPrice: num(li.unitPrice),
  }));
  const taxRatePct = num(e.taxRatePct);
  const t = invoiceTotals(lineItems, taxRatePct);

  return {
    agency: e.agency,
    lineItems,
    subtotal: t.subtotal,
    taxRatePct,
    tax: t.tax,
    client: {
      companyName: e.client.companyName ?? e.client.name,
      contactName: e.client.name,
      email: e.client.email,
      address: e.client.address,
      city: e.client.city,
      state: e.client.state,
      country: e.client.country,
      zipCode: e.client.zipCode,
    },
    invoiceNumber: e.invoiceNumber,
    projectName: e.project.name,
    amount,
    amountPaid,
    balance: Math.max(0, amount - amountPaid),
    status: displayInvoiceStatus(e.status, e.dueDate, amount, amountPaid, now),
    issueDate: e.issueDate ? e.issueDate.toISOString() : null,
    dueDate: e.dueDate.toISOString(),
    notes: e.notes,
  };
}

/** Next INV-YYYY-NNN for this agency. */
export async function nextInvoiceNumber(agencyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await prisma.invoice.findFirst({
    where: { agencyId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const seq = latest ? Number(latest.invoiceNumber.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export interface InvoiceProjectOption {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
}

export async function invoiceableProjects(
  agencyId: string,
): Promise<InvoiceProjectOption[]> {
  const rows = await prisma.project.findMany({
    where: { agencyId, status: { not: "closed" } },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      clientId: true,
      client: { select: { name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    clientId: r.clientId,
    clientName: r.client.name,
  }));
}
