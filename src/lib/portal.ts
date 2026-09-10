import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { displayInvoiceStatus } from "@/lib/invoice-status";
import type { InvoiceStatus } from "@/lib/dashboard-types";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export function generatePortalToken(): string {
  return randomBytes(18).toString("base64url");
}

export interface PortalData {
  agency: { name: string; logoUrl: string | null; brandColor: string };
  client: { companyName: string; contactName: string };
  projects: {
    id: string;
    name: string;
    status: string;
    progressPercentage: number;
    contractValue: number;
    startDate: string | null;
    deadline: string | null;
  }[];
  invoices: {
    invoiceNumber: string;
    status: InvoiceStatus;
    amount: number;
    amountPaid: number;
    balance: number;
    issueDate: string | null;
    dueDate: string;
  }[];
  totals: { invoiced: number; paid: number; outstanding: number };
}

export async function getPortalData(token: string): Promise<PortalData | null> {
  const now = new Date();
  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    select: {
      companyName: true,
      name: true,
      isActive: true,
      agency: {
        select: { name: true, logoUrl: true, brandColor: true },
      },
      projects: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          progressPercentage: true,
          contractValue: true,
          startDate: true,
          deadline: true,
        },
      },
      invoices: {
        where: { status: { not: "draft" } },
        orderBy: { createdAt: "desc" },
        select: {
          invoiceNumber: true,
          amount: true,
          status: true,
          issueDate: true,
          dueDate: true,
          payments: { select: { amount: true } },
        },
      },
    },
  });

  if (!client || !client.isActive) return null;

  // Best-effort: stamp first-viewed on the invoices this client can see.
  prisma.invoice
    .updateMany({
      where: {
        client: { portalToken: token },
        viewedDate: null,
        status: { not: "draft" },
      },
      data: { viewedDate: now },
    })
    .catch(() => {});

  const invoices = client.invoices.map((i) => {
    const amount = num(i.amount);
    const amountPaid = i.payments.reduce((s, p) => s + num(p.amount), 0);
    return {
      invoiceNumber: i.invoiceNumber,
      status: displayInvoiceStatus(i.status, i.dueDate, amount, amountPaid, now),
      amount,
      amountPaid,
      balance: Math.max(0, amount - amountPaid),
      issueDate: i.issueDate ? i.issueDate.toISOString() : null,
      dueDate: i.dueDate.toISOString(),
    };
  });

  return {
    agency: client.agency,
    client: { companyName: client.companyName ?? client.name, contactName: client.name },
    projects: client.projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      progressPercentage: p.progressPercentage,
      contractValue: num(p.contractValue),
      startDate: p.startDate ? p.startDate.toISOString() : null,
      deadline: p.deadline ? p.deadline.toISOString() : null,
    })),
    invoices,
    totals: {
      invoiced: invoices.reduce((s, i) => s + i.amount, 0),
      paid: invoices.reduce((s, i) => s + i.amountPaid, 0),
      outstanding: invoices
        .filter((i) => i.status !== "cancelled")
        .reduce((s, i) => s + i.balance, 0),
    },
  };
}
