/* Pure invoice arithmetic: subtotal → tax → total. Unit-tested. */

export interface LineItemLike {
  quantity: number;
  unitPrice: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface InvoiceTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export function invoiceTotals(
  items: LineItemLike[],
  taxRatePct: number,
): InvoiceTotals {
  const subtotal = round2(
    items.reduce((s, li) => s + li.quantity * li.unitPrice, 0),
  );
  const rate = Number.isFinite(taxRatePct) ? Math.max(0, taxRatePct) : 0;
  const tax = round2(subtotal * (rate / 100));
  return { subtotal, tax, total: round2(subtotal + tax) };
}

export function lineAmount(li: LineItemLike): number {
  return round2(li.quantity * li.unitPrice);
}
