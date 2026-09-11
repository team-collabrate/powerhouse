import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { invoiceTotals } from "@/lib/invoice-total";
import { syncInvoicePaidState } from "@/lib/invoice-sync";
import type { ImportPlan } from "@/lib/import/build-plan";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

async function nextInvoiceNumberTx(tx: Tx, agencyId: string, used: Set<string>): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await tx.invoice.findFirst({
    where: { agencyId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  let seq = latest ? Number(latest.invoiceNumber.slice(prefix.length)) + 1 : 1;
  let candidate = `${prefix}${String(seq).padStart(3, "0")}`;
  while (used.has(candidate)) {
    seq += 1;
    candidate = `${prefix}${String(seq).padStart(3, "0")}`;
  }
  used.add(candidate);
  return candidate;
}

export interface ImportCommitSummary {
  clients: number;
  projects: number;
  invoices: number;
  payments: number;
}

/** Writes a validated ImportPlan for one agency in a single transaction. */
export async function commitImportPlan(
  agencyId: string,
  userId: string,
  plan: ImportPlan,
): Promise<ImportCommitSummary> {
  const invoiceIdByRef = new Map<string, string>();

  await prisma.$transaction(
    async (tx) => {
      const clientIdByRef = new Map<string, string>();
      for (const c of plan.clients) {
        const created = await tx.client.create({
          data: {
            agencyId,
            name: c.name,
            companyName: c.companyName,
            email: c.email,
            phone: c.phone,
            address: c.address,
            city: c.city,
            country: c.country,
          },
        });
        clientIdByRef.set(c.ref, created.id);
      }

      const projectIdByRef = new Map<string, string>();
      const projectClientId = new Map<string, string>();
      for (const p of plan.projects) {
        const clientId = clientIdByRef.get(p.clientRef);
        if (!clientId) throw new Error(`Project ${p.ref}: unresolved client_ref ${p.clientRef}`);
        const created = await tx.project.create({
          data: {
            agencyId,
            clientId,
            name: p.name,
            serviceType: p.serviceType,
            status: p.status,
            contractValue: p.contractValue,
            teamCost: p.teamCost,
            startDate: p.startDate ? new Date(p.startDate) : null,
            deadline: p.deadline ? new Date(p.deadline) : null,
            progressPercentage: p.progressPercentage,
          },
        });
        projectIdByRef.set(p.ref, created.id);
        projectClientId.set(p.ref, clientId);
      }

      const usedInvoiceNumbers = new Set<string>();
      for (const inv of plan.invoices) {
        const projectId = projectIdByRef.get(inv.projectRef);
        const clientId = projectClientId.get(inv.projectRef);
        if (!projectId || !clientId) throw new Error(`Invoice ${inv.ref}: unresolved project_ref ${inv.projectRef}`);
        const { total } = invoiceTotals(inv.lineItems, inv.taxRatePct);
        const invoiceNumber =
          inv.invoiceNumber || (await nextInvoiceNumberTx(tx, agencyId, usedInvoiceNumbers));
        if (inv.invoiceNumber) usedInvoiceNumbers.add(inv.invoiceNumber);
        const created = await tx.invoice.create({
          data: {
            agencyId,
            clientId,
            projectId,
            invoiceNumber,
            amount: total,
            taxRatePct: inv.taxRatePct,
            status: inv.status,
            issueDate: inv.issueDate ? new Date(inv.issueDate) : null,
            dueDate: new Date(inv.dueDate),
            sentDate: inv.status === "sent" ? (inv.issueDate ? new Date(inv.issueDate) : new Date()) : null,
            createdBy: userId,
            lineItems: {
              create: inv.lineItems.map((li, i) => ({
                description: li.description,
                quantity: li.quantity,
                unitPrice: li.unitPrice,
                position: i,
              })),
            },
          },
        });
        invoiceIdByRef.set(inv.ref, created.id);
      }

      for (const pay of plan.payments) {
        const invoiceId = invoiceIdByRef.get(pay.invoiceRef);
        if (!invoiceId) throw new Error(`Payment: unresolved invoice_ref ${pay.invoiceRef}`);
        await tx.payment.create({
          data: {
            invoiceId,
            amount: pay.amount,
            paymentDate: new Date(pay.paymentDate),
            paymentMethod: pay.paymentMethod,
            referenceNumber: pay.referenceNumber,
            recordedBy: userId,
          },
        });
      }
    },
    { timeout: 30_000 },
  );

  // outside the transaction — syncInvoicePaidState reads via the global
  // prisma client and only needs to see already-committed rows.
  const invoiceIdsWithPayments = new Set(
    plan.payments.map((p) => invoiceIdByRef.get(p.invoiceRef)).filter((id): id is string => !!id),
  );
  for (const id of invoiceIdsWithPayments) {
    await syncInvoicePaidState(id);
  }

  return {
    clients: plan.clients.length,
    projects: plan.projects.length,
    invoices: plan.invoices.length,
    payments: plan.payments.length,
  };
}

export type { Prisma };
