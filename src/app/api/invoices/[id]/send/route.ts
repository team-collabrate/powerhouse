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
      client: { select: { name: true, email: true } },
    },
  });
  if (!inv) return fail("NOT_FOUND", "Invoice not found", 404);
  if (inv.status !== "draft")
    return fail("INVALID_STATE", `Invoice is already ${inv.status}`, 409);

  await prisma.invoice.update({
    where: { id },
    data: { status: "sent", sentDate: new Date() },
  });

  // Email delivery is Sprint 4 (Resend). For now the status transitions and
  // we record the intent.
  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "sent_invoice",
    entityType: "invoice",
    entityId: id,
    description: `Marked ${inv.invoiceNumber} as sent to ${inv.client.name}`,
    metadata: { clientEmail: inv.client.email, emailDelivered: false },
  });

  return ok({ id, status: "sent", emailDelivered: false });
}
