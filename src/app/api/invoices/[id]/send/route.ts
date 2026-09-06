import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { generatePortalToken } from "@/lib/portal";
import { sendInvoiceEmail, appUrl } from "@/lib/email";
import { formatCurrency, formatDate } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireCapability("invoice:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const inv = await prisma.invoice.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      amount: true,
      dueDate: true,
      clientId: true,
      client: { select: { name: true, email: true, portalToken: true } },
      agency: { select: { name: true } },
    },
  });
  if (!inv) return fail("NOT_FOUND", "Invoice not found", 404);
  if (inv.status !== "draft")
    return fail("INVALID_STATE", `Invoice is already ${inv.status}`, 409);

  // ensure the client has a portal link so the email has somewhere to point
  let token = inv.client.portalToken;
  if (!token) {
    token = generatePortalToken();
    await prisma.client.update({
      where: { id: inv.clientId },
      data: { portalToken: token },
    });
  }

  await prisma.invoice.update({
    where: { id },
    data: { status: "sent", sentDate: new Date() },
  });

  const email = await sendInvoiceEmail({
    to: inv.client.email,
    agencyName: inv.agency.name,
    invoiceNumber: inv.invoiceNumber,
    amount: formatCurrency(Number(inv.amount)),
    dueDate: formatDate(inv.dueDate),
    portalUrl: `${appUrl}/portal/${token}`,
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "sent_invoice",
    entityType: "invoice",
    entityId: id,
    description: `Sent ${inv.invoiceNumber} to ${inv.client.name}`,
    metadata: { emailDelivered: email.delivered, to: inv.client.email },
  });

  return ok({ id, status: "sent", ...email });
}
