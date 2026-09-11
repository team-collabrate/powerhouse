import { fyQuarterOf } from "@/lib/period";
import { inRange, round0, sum } from "./shared";

export interface GstInvoice {
  issueDate: Date | null;
  /** the invoice total, tax-INCLUSIVE (`invoices.amount`) */
  amount: number;
  taxRatePct: number;
  status: string;
}

export interface GstQuarterRow {
  fy: string;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  label: string;
  taxable: number;
  tax: number;
  invoiceCount: number;
}

/** The tax portion of a tax-inclusive total. */
export function taxPortion(amountInclusive: number, ratePct: number): number {
  if (!(ratePct > 0)) return 0;
  return amountInclusive - amountInclusive / (1 + ratePct / 100);
}

const eligible = (i: GstInvoice) =>
  i.issueDate != null && i.status !== "draft" && i.status !== "cancelled";

/** Every FY quarter that has an eligible invoice, oldest first. */
export function buildGstByQuarter(invoices: GstInvoice[]): GstQuarterRow[] {
  const groups = new Map<string, GstQuarterRow>();
  for (const i of invoices) {
    if (!eligible(i)) continue;
    const q = fyQuarterOf(i.issueDate as Date);
    const key = `${q.fy}:${q.q}`;
    const row =
      groups.get(key) ??
      ({
        fy: q.fy,
        quarter: q.q,
        label: q.label,
        taxable: 0,
        tax: 0,
        invoiceCount: 0,
      } as GstQuarterRow);
    const tax = taxPortion(i.amount, i.taxRatePct);
    row.tax += tax;
    row.taxable += i.amount - tax;
    row.invoiceCount += 1;
    groups.set(key, row);
  }
  return [...groups.values()]
    .map((r) => ({ ...r, tax: round0(r.tax), taxable: round0(r.taxable) }))
    .sort((a, b) =>
      a.fy === b.fy ? a.quarter.localeCompare(b.quarter) : a.fy.localeCompare(b.fy),
    );
}

export interface GstSummary {
  taxable: number;
  tax: number;
  invoiceCount: number;
}

/** Tax collected on invoices issued within [from, to). */
export function buildGstSummary(
  invoices: GstInvoice[],
  from: Date,
  to: Date,
): GstSummary {
  const rows = inRange(
    invoices.filter(eligible).map((i) => ({ ...i, date: i.issueDate as Date })),
    from,
    to,
  );
  const tax = sum(rows.map((i) => taxPortion(i.amount, i.taxRatePct)));
  const taxable = sum(rows.map((i) => i.amount)) - tax;
  return { taxable: round0(taxable), tax: round0(tax), invoiceCount: rows.length };
}
