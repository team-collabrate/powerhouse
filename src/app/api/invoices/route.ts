import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { invoiceCreateSchema } from "@/lib/validation/invoice";
import {
  listInvoices,
  nextInvoiceNumber,
  type InvoiceStatus,
} from "@/lib/queries/invoices";
import { formatCurrency } from "@/lib/format";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(request.url);
  const result = await listInvoices(auth.agencyId, {
    status: (searchParams.get("status") as InvoiceStatus | "all") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  return ok(result);
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = invoiceCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, agencyId: auth.agencyId },
    select: { id: true, name: true, clientId: true },
  });
  if (!project) return fail("INVALID_PROJECT", "Unknown project", 400);

  // retry once on the (agencyId, invoiceNumber) unique race
  let invoice: { id: string; invoiceNumber: string } | null = null;
  for (let attempt = 0; attempt < 3 && !invoice; attempt++) {
    const number = await nextInvoiceNumber(auth.agencyId);
    try {
      invoice = await prisma.invoice.create({
        data: {
          agencyId: auth.agencyId,
          clientId: project.clientId,
          projectId: project.id,
          invoiceNumber: number,
          amount: input.amount,
          status: "draft",
          issueDate: new Date(input.issueDate),
          dueDate: new Date(input.dueDate),
          notes: input.notes || null,
          createdBy: auth.userId,
        },
        select: { id: true, invoiceNumber: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue;
      }
      throw err;
    }
  }
  if (!invoice) return fail("CONFLICT", "Could not allocate an invoice number", 409);

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "created_invoice",
    entityType: "invoice",
    entityId: invoice.id,
    description: `Created ${invoice.invoiceNumber} (${formatCurrency(input.amount)}) for ${project.name}`,
  });

  return ok(invoice, { status: 201 });
}
