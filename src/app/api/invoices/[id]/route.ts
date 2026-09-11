import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession , requireCapability} from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { invoiceEditSchema, invoiceUpdateSchema } from "@/lib/validation/invoice";
import { getInvoice } from "@/lib/queries/invoices";
import { invoiceTotals } from "@/lib/invoice-total";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const invoice = await getInvoice(auth.agencyId, id);
  if (!invoice) return fail("NOT_FOUND", "Invoice not found", 404);
  return ok(invoice);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCapability("invoice:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, invoiceNumber: true, status: true },
  });
  if (!existing) return fail("NOT_FOUND", "Invoice not found", 404);
  if (existing.status === "cancelled")
    return fail("INVALID_STATE", "Cancelled invoices can't be edited", 409);

  const body = await request.json().catch(() => null);

  // Full editor save (line items + tax + dates): draft only.
  if (body && Array.isArray(body.lineItems)) {
    if (existing.status !== "draft") {
      return fail(
        "INVALID_STATE",
        "Line items and amount can only change while the invoice is a draft",
        409,
      );
    }
    const parsed = invoiceEditSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error);
    const input = parsed.data;
    const { total } = invoiceTotals(input.lineItems, input.taxRatePct);

    await prisma.$transaction([
      prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } }),
      prisma.invoiceLineItem.createMany({
        data: input.lineItems.map((li, i) => ({
          invoiceId: id,
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          position: i,
        })),
      }),
      prisma.invoice.update({
        where: { id },
        data: {
          amount: total,
          taxRatePct: input.taxRatePct,
          ...(input.issueDate !== undefined && {
            issueDate: new Date(input.issueDate),
          }),
          ...(input.dueDate !== undefined && {
            dueDate: new Date(input.dueDate),
          }),
          ...(input.notes !== undefined && { notes: input.notes || null }),
        },
      }),
    ]);

    await logActivity({
      agencyId: auth.agencyId,
      userId: auth.userId,
      action: "updated_invoice",
      entityType: "invoice",
      entityId: id,
      description: `Edited ${existing.invoiceNumber} (${input.lineItems.length} line item${input.lineItems.length === 1 ? "" : "s"})`,
    });
    return ok({ id });
  }

  // Light edit (notes / due date): allowed on sent/overdue too.
  const parsed = invoiceUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  await prisma.invoice.update({
    where: { id },
    data: {
      ...(input.dueDate !== undefined && { dueDate: new Date(input.dueDate) }),
      ...(input.notes !== undefined && { notes: input.notes || null }),
    },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_invoice",
    entityType: "invoice",
    entityId: id,
    description: `Updated ${existing.invoiceNumber}`,
    metadata: { changed: Object.keys(input) },
  });

  return ok({ id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCapability("invoice:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, invoiceNumber: true, status: true },
  });
  if (!existing) return fail("NOT_FOUND", "Invoice not found", 404);
  if (existing.status !== "draft")
    return fail(
      "INVALID_STATE",
      "Only drafts can be deleted. Cancel a sent invoice instead.",
      409,
    );

  await prisma.invoice.delete({ where: { id } });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "deleted_invoice",
    entityType: "invoice",
    entityId: id,
    description: `Deleted draft ${existing.invoiceNumber}`,
  });

  return ok({ id });
}
