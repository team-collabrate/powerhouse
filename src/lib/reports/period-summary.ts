import { metric, round1, type Metric, type Totals } from "./shared";

export interface PeriodSummary {
  revenue: Metric;
  cost: Metric;
  net: Metric;
  /** net margin % this period and last — a point difference, not a ratio */
  marginPct: number;
  prevMarginPct: number;
  marginDeltaPts: number | null;
}

const marginOf = (t: Totals) =>
  t.revenue > 0 ? ((t.revenue - t.cost) / t.revenue) * 100 : 0;

export function buildPeriodSummary(curr: Totals, prev: Totals): PeriodSummary {
  const net = { value: curr.revenue - curr.cost, prev: prev.revenue - prev.cost };
  const marginPct = round1(marginOf(curr));
  const prevMarginPct = round1(marginOf(prev));
  return {
    revenue: metric(curr.revenue, prev.revenue),
    cost: metric(curr.cost, prev.cost),
    net: metric(net.value, net.prev),
    marginPct,
    prevMarginPct,
    marginDeltaPts:
      prev.revenue === 0 ? null : round1(marginPct - prevMarginPct),
  };
}
