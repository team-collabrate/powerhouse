import { inRange, round0, round1, sum } from "./shared";

export interface PaymentRow {
  method: string;
  amount: number;
  date: Date;
}

export interface PaymentMethodSlice {
  method: string;
  count: number;
  amount: number;
  pct: number;
}

/** Payments received in [from, to), grouped by method, biggest first. */
export function buildPaymentMethodMix(
  payments: PaymentRow[],
  from: Date,
  to: Date,
): PaymentMethodSlice[] {
  const rows = inRange(payments, from, to);
  const total = sum(rows.map((r) => r.amount));
  const byMethod = new Map<string, PaymentRow[]>();
  for (const r of rows) {
    const list = byMethod.get(r.method) ?? [];
    list.push(r);
    byMethod.set(r.method, list);
  }
  return [...byMethod.entries()]
    .map(([method, list]) => {
      const amount = sum(list.map((r) => r.amount));
      return {
        method,
        count: list.length,
        amount: round0(amount),
        pct: total > 0 ? round1((amount / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}
