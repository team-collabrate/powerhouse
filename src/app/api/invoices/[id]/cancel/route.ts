import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireSession } from "@/lib/api";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const inv = await prisma.invoice.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      _count: { select: { payments: true } },
    },
  });
  if (!inv) return fail("NOT_FOUND", "Invoice not found", 404);
  if (inv.status === "cancelled")
    return fail("INVALID_STATE", "Already cancelled", 409);
  if (inv._count.payments > 0)
    return fail(
      "INVALID_STATE",
      "Remove the recorded payments before cancelling",
      409,
    );

  await prisma.invoice.update({
    where: { id },
    data: { status: "cancelled" },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "cancelled_invoice",
    entityType: "invoice",
    entityId: id,
    description: `Cancelled ${inv.invoiceNumber}`,
  });

  return ok({ id, status: "cancelled" });
}
