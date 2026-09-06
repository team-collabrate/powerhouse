import { prisma } from "@/lib/prisma";

/**
 * Keep the invoice's stored `status`/`paidDate` in step with its payments.
 * Only moves between "sent" and "paid" — never touches draft/cancelled.
 * Returns the resulting stored status.
 */
export async function syncInvoicePaidState(invoiceId: string): Promise<string> {
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      amount: true,
      status: true,
      payments: { select: { amount: true, paymentDate: true } },
    },
  });
  if (!inv) return "unknown";
  if (inv.status === "draft" || inv.status === "cancelled") return inv.status;

  const amount = Number(inv.amount);
  const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
  const fullyPaid = amount > 0 && paid >= amount;

  if (fullyPaid && inv.status !== "paid") {
    const lastDate = inv.payments
      .map((p) => p.paymentDate)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "paid", paidDate: lastDate ?? new Date() },
    });
    return "paid";
  }
  if (!fullyPaid && inv.status === "paid") {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: "sent", paidDate: null },
    });
    return "sent";
  }
  return inv.status;
}
