import { DAY_MS, mean, median, round1, sum } from "./shared";

export interface DsoInvoice {
  invoiceNumber: string;
  issueDate: Date | null;
  paidDate: Date | null;
  /** invoice total */
  amount: number;
}

export interface DsoResult {
  avgDays: number;
  medianDays: number;
  /** amount-weighted average — big invoices count more */
  weightedAvgDays: number;
  paidCount: number;
  slowest: { invoiceNumber: string; days: number; amount: number }[];
}

/** Collection speed for invoices whose payment landed in [from, to). */
export function buildDso(invoices: DsoInvoice[], from: Date, to: Date): DsoResult {
  const settled = invoices
    .filter(
      (i): i is DsoInvoice & { issueDate: Date; paidDate: Date } =>
        i.issueDate != null &&
        i.paidDate != null &&
        i.paidDate >= from &&
        i.paidDate < to,
    )
    .map((i) => ({
      invoiceNumber: i.invoiceNumber,
      amount: i.amount,
      days: Math.max(
        0,
        Math.round((i.paidDate.getTime() - i.issueDate.getTime()) / DAY_MS),
      ),
    }));

  const days = settled.map((s) => s.days);
  const amountTotal = sum(settled.map((s) => s.amount));

  return {
    avgDays: round1(mean(days)),
    medianDays: round1(median(days)),
    weightedAvgDays:
      amountTotal > 0
        ? round1(sum(settled.map((s) => s.days * s.amount)) / amountTotal)
        : 0,
    paidCount: settled.length,
    slowest: [...settled]
      .sort((a, b) => b.days - a.days)
      .slice(0, 5)
      .map((s) => ({ invoiceNumber: s.invoiceNumber, days: s.days, amount: s.amount })),
  };
}
