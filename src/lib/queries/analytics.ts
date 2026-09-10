/**
 * Pure analytics helpers — no Prisma, no cache. The period-scoped fetching
 * lives in `src/lib/queries/report.ts` (`getReport`).
 */
import { calculateProjectProfit } from "@/lib/profit";
import type { ProjectStatus } from "@/lib/queries/projects";
import {
  serviceLabel,
  serviceColor,
  type ServiceLite,
} from "@/lib/services";

export interface MonthlyPoint {
  label: string;
  revenue: number; // payments received in the bucket
  cost: number; // project expenses + company overhead, by date
  net: number;
}

export interface ProfitabilityRow {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  serviceType: string;
  serviceLabel: string;
  serviceColor: string;
  contractValue: number;
  teamCost: number;
  expenses: number;
  overhead: number;
  totalCost: number;
  profit: number;
  margin: number;
  /** delivery progress %, 0–100 */
  progress: number;
}

export interface ProfitabilityInput {
  id: string;
  name: string;
  clientName: string;
  status: string;
  serviceType: string;
  contractValue: number;
  teamCost: number;
  progressPercentage: number;
  expenses: number[];
}

/** Per-project cost breakdown, ranked by margin (worst first is the caller's job). */
export function buildProfitability(
  projects: ProfitabilityInput[],
  overheadFor: (projectId: string) => number,
  services: ServiceLite[] = [],
): ProfitabilityRow[] {
  return projects
    .map((p) => {
      const overhead = overheadFor(p.id);
      const pr = calculateProjectProfit({
        contractValue: p.contractValue,
        teamCost: p.teamCost,
        allocatedOverhead: overhead,
        expenses: p.expenses.map((amount) => ({ amount })),
      });
      return {
        id: p.id,
        name: p.name,
        client: p.clientName,
        status: p.status as ProjectStatus,
        serviceType: p.serviceType,
        serviceLabel: serviceLabel(services, p.serviceType),
        serviceColor: serviceColor(services, p.serviceType),
        contractValue: p.contractValue,
        teamCost: p.teamCost,
        expenses: pr.totalExpenses,
        overhead,
        totalCost: pr.totalCost,
        profit: pr.profit,
        margin: Number(pr.profitMargin.toFixed(1)),
        progress: p.progressPercentage,
      };
    })
    .sort((a, b) => b.margin - a.margin);
}

export interface ServiceMixSlice {
  label: string;
  value: number; // % of contract value
  amount: number;
  color: string;
}

export function serviceMixByContract(
  rows: { serviceType: string; contractValue: number }[],
  services: ServiceLite[] = [],
): ServiceMixSlice[] {
  const byService = new Map<string, number>();
  for (const r of rows) {
    byService.set(
      r.serviceType,
      (byService.get(r.serviceType) ?? 0) + r.contractValue,
    );
  }
  const total = [...byService.values()].reduce((s, v) => s + v, 0);
  if (total <= 0) return [];
  return [...byService.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, amount]) => ({
      label: serviceLabel(services, type),
      color: serviceColor(services, type),
      amount,
      value: Math.round((amount / total) * 100),
    }));
}

export function profitabilityCsv(rows: ProfitabilityRow[]): string {
  const head = [
    "Project",
    "Client",
    "Status",
    "Service",
    "Contract",
    "Team cost",
    "Expenses",
    "Overhead",
    "Total cost",
    "Profit",
    "Margin %",
    "Progress %",
  ];
  const lines = rows.map((r) =>
    [
      r.name,
      r.client,
      r.status,
      r.serviceLabel,
      r.contractValue,
      r.teamCost,
      r.expenses,
      r.overhead,
      r.totalCost,
      r.profit,
      r.margin,
      r.progress,
    ]
      .map((v) => {
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(","),
  );
  return [head.join(","), ...lines].join("\n");
}
