import type { InvoiceStatus } from "@/lib/dashboard-types";

/**
 * The status to *show*, derived from the stored status + payment reality +
 * the due date. Payments are the source of truth for paid/partial; the DB
 * `status` column only carries draft / sent / cancelled intent.
 */
export function displayInvoiceStatus(
  rawStatus: string,
  dueDate: Date,
  amount: number,
  amountPaid: number,
  now: Date = new Date(),
): InvoiceStatus {
  const s = rawStatus.toLowerCase();
  if (s === "cancelled") return "cancelled";
  if (s === "draft") return "draft";
  if (amount > 0 && amountPaid >= amount) return "paid";
  if (amountPaid > 0) return "partial";
  return dueDate < now ? "overdue" : "sent";
}

/** Counts toward "money owed to us". */
export function isOutstanding(status: InvoiceStatus): boolean {
  return status === "sent" || status === "partial" || status === "overdue";
}
