import { round0, round1, sum } from "./shared";

export interface ClientRevenueRow {
  id: string;
  name: string;
  /** payments received from this client within the period */
  paidInPeriod: number;
  outstanding: number;
  lifetimeValue: number;
}

export interface RankedClient extends ClientRevenueRow {
  rank: number;
  revenuePct: number;
  cumulativePct: number;
}

export interface ClientRanking {
  rows: RankedClient[];
  top1Pct: number;
  top3Pct: number;
  /** Herfindahl index of period revenue, 0–10000 (higher = more concentrated) */
  hhi: number;
}

/** Clients ranked by period revenue, with concentration measures. */
export function buildClientRanking(rows: ClientRevenueRow[]): ClientRanking {
  const sorted = [...rows].sort((a, b) => b.paidInPeriod - a.paidInPeriod);
  const total = sum(sorted.map((r) => r.paidInPeriod));

  let cumulative = 0;
  const ranked: RankedClient[] = sorted.map((r, i) => {
    const pct = total > 0 ? (r.paidInPeriod / total) * 100 : 0;
    cumulative += pct;
    return {
      ...r,
      paidInPeriod: round0(r.paidInPeriod),
      outstanding: round0(r.outstanding),
      lifetimeValue: round0(r.lifetimeValue),
      rank: i + 1,
      revenuePct: round1(pct),
      cumulativePct: round1(cumulative),
    };
  });

  return {
    rows: ranked,
    top1Pct: round1(ranked[0]?.revenuePct ?? 0),
    top3Pct: round1(sum(ranked.slice(0, 3).map((r) => r.revenuePct))),
    hhi: round0(sum(ranked.map((r) => r.revenuePct * r.revenuePct))),
  };
}
