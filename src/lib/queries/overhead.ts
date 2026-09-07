import { prisma } from "@/lib/prisma";
import {
  allocateOverhead,
  overheadMonthlyPool,
  OVERHEAD_METHOD_LABELS,
  type OverheadMethod,
} from "@/lib/overhead";

const num = (d: unknown): number => (d == null ? 0 : Number(d));

export interface OverheadResolver {
  method: OverheadMethod;
  methodLabel: string;
  /** fraction 0..1 */
  percentRate: number;
  monthlyPool: number;
  /** allocated overhead for a project id; 0 for an unknown id */
  overheadFor(projectId: string): number;
}

const NO_OP: OverheadResolver = {
  method: "manual",
  methodLabel: OVERHEAD_METHOD_LABELS.manual,
  percentRate: 0,
  monthlyPool: 0,
  overheadFor: () => 0,
};

/**
 * Load the agency's overhead rule + expense pool + project portfolio and
 * resolve every project's allocated overhead once. Never throws — the
 * pages that consume this (/projects, /analytics, /clients/[id],
 * /projects/[id]) have no demo fallback, so a failure returns a no-op
 * resolver (behaves exactly like method = "manual").
 */
export async function resolveAgencyOverhead(
  agencyId: string,
  opts?: { now?: Date },
): Promise<OverheadResolver> {
  const now = opts?.now ?? new Date();
  try {
    const [agency, expenses, portfolio] = await Promise.all([
      prisma.agency.findUnique({
        where: { id: agencyId },
        select: { overheadMethod: true, overheadRate: true },
      }),
      prisma.companyExpense.findMany({
        where: { agencyId },
        select: {
          amount: true,
          dateIncurred: true,
          isRecurring: true,
          recurringFrequency: true,
        },
      }),
      prisma.project.findMany({
        where: { agencyId },
        select: {
          id: true,
          status: true,
          contractValue: true,
          startDate: true,
          deadline: true,
          allocatedOverhead: true,
        },
      }),
    ]);
    if (!agency) return NO_OP;

    const method = (agency.overheadMethod as OverheadMethod) ?? "manual";
    const percentRate = num(agency.overheadRate);
    const monthlyPool = overheadMonthlyPool(
      expenses.map((e) => ({
        amount: num(e.amount),
        dateIncurred: e.dateIncurred,
        isRecurring: e.isRecurring,
        recurringFrequency: e.recurringFrequency,
      })),
      now,
    );

    const map = allocateOverhead(
      { method, percentRate },
      monthlyPool,
      portfolio.map((p) => ({
        id: p.id,
        status: p.status,
        contractValue: num(p.contractValue),
        startDate: p.startDate,
        deadline: p.deadline,
        overrideOverhead: num(p.allocatedOverhead),
      })),
    );

    return {
      method,
      methodLabel: OVERHEAD_METHOD_LABELS[method] ?? OVERHEAD_METHOD_LABELS.manual,
      percentRate,
      monthlyPool,
      overheadFor: (id: string) => map.get(id) ?? 0,
    };
  } catch (err) {
    console.error("resolveAgencyOverhead failed", err);
    return NO_OP;
  }
}
