import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { paymentCreateSchema } from "@/lib/validation/invoice";
import { syncInvoicePaidState } from "@/lib/invoice-sync";
import { formatCurrency } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id: invoiceId } = await params;

  const inv = await prisma.invoice.findFirst({
    where: { id: invoiceId, agencyId: auth.agencyId },
    select: { id: true, invoiceNumber: true, status: true },
  });
  if (!inv) return fail("NOT_FOUND", "Invoice not found", 404);
  if (inv.status === "draft")
    return fail("INVALID_STATE", "Send the invoice before recording a payment", 409);
  if (inv.status === "cancelled")
    return fail("INVALID_STATE", "Invoice is cancelled", 409);

  const body = await request.json().catch(() => null);
  const parsed = paymentCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      amount: input.amount,
      paymentDate: new Date(input.paymentDate),
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber || null,
      notes: input.notes || null,
      recordedBy: auth.userId,
    },
    select: { id: true },
  });

  const status = await syncInvoicePaidState(invoiceId);

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "recorded_payment",
    entityType: "payment",
    entityId: payment.id,
    description: `Recorded ${formatCurrency(input.amount)} against ${inv.invoiceNumber}`,
    metadata: { invoiceId, method: input.paymentMethod },
  });

  return ok({ id: payment.id, invoiceStatus: status }, { status: 201 });
}
