import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireCapability} from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { syncInvoicePaidState } from "@/lib/invoice-sync";
import { formatCurrency } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCapability("payment:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const payment = await prisma.payment.findFirst({
    where: { id, invoice: { agencyId: auth.agencyId } },
    select: {
      id: true,
      amount: true,
      invoiceId: true,
      invoice: { select: { invoiceNumber: true } },
    },
  });
  if (!payment) return fail("NOT_FOUND", "Payment not found", 404);

  await prisma.payment.delete({ where: { id } });
  const status = await syncInvoicePaidState(payment.invoiceId);

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "deleted_payment",
    entityType: "payment",
    entityId: id,
    description: `Removed ${formatCurrency(Number(payment.amount))} payment from ${payment.invoice.invoiceNumber}`,
    metadata: { invoiceId: payment.invoiceId },
  });

  return ok({ id, invoiceStatus: status });
}
