import { isOutstanding } from "@/lib/invoice-status";
import type { InvoiceStatus } from "@/lib/dashboard-types";
import { DAY_MS, round0, sum } from "./shared";

export interface AgingInvoice {
  balance: number;
  dueDate: Date;
  displayStatus: InvoiceStatus;
  clientName: string;
}

export const AGING_BUCKETS = ["current", "1-30", "31-60", "61-90", "90+"] as const;
export type AgingBucket = (typeof AGING_BUCKETS)[number];

export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  current: "Not due",
  "1-30": "1–30 days",
  "31-60": "31–60 days",
  "61-90": "61–90 days",
  "90+": "90+ days",
};

function bucketOf(daysPast: number): AgingBucket {
  if (daysPast <= 0) return "current";
  if (daysPast <= 30) return "1-30";
  if (daysPast <= 60) return "31-60";
  if (daysPast <= 90) return "61-90";
  return "90+";
}

export interface AgingResult {
  buckets: { bucket: AgingBucket; label: string; amount: number; count: number }[];
  byClient: { clientName: string; amount: number; oldestDays: number }[];
  total: number;
}

/** Outstanding receivables split by how overdue they are. */
export function buildAgingBuckets(invoices: AgingInvoice[], now: Date): AgingResult {
  const open = invoices.filter(
    (i) => isOutstanding(i.displayStatus) && i.balance > 0,
  );

  const bucketTotals = new Map<AgingBucket, { amount: number; count: number }>();
  const clientTotals = new Map<string, { amount: number; oldestDays: number }>();

  for (const i of open) {
    const daysPast = Math.floor((now.getTime() - i.dueDate.getTime()) / DAY_MS);
    const b = bucketOf(daysPast);
    const bt = bucketTotals.get(b) ?? { amount: 0, count: 0 };
    bt.amount += i.balance;
    bt.count += 1;
    bucketTotals.set(b, bt);

    const ct = clientTotals.get(i.clientName) ?? { amount: 0, oldestDays: 0 };
    ct.amount += i.balance;
    ct.oldestDays = Math.max(ct.oldestDays, daysPast);
    clientTotals.set(i.clientName, ct);
  }

  return {
    buckets: AGING_BUCKETS.map((bucket) => ({
      bucket,
      label: AGING_BUCKET_LABELS[bucket],
      amount: round0(bucketTotals.get(bucket)?.amount ?? 0),
      count: bucketTotals.get(bucket)?.count ?? 0,
    })),
    byClient: [...clientTotals.entries()]
      .map(([clientName, v]) => ({
        clientName,
        amount: round0(v.amount),
        oldestDays: v.oldestDays,
      }))
      .sort((a, b) => b.amount - a.amount),
    total: round0(sum(open.map((i) => i.balance))),
  };
}
