import { prisma } from "@/lib/prisma";
import {
  buildMilestoneRollup,
  type MilestoneRollup,
} from "@/lib/reports/milestone-rollup";

export type {
  MilestoneRollup,
  MilestoneRollupRow,
} from "@/lib/reports/milestone-rollup";

/**
 * Cross-project milestone rollup (upcoming / overdue / completion).
 * Not cached itself — callers (`getReport`) sit behind `cacheAgencyRead`.
 */
export async function getMilestoneRollup(
  agencyId: string,
  period?: { from: Date; to: Date },
): Promise<MilestoneRollup> {
  const rows = await prisma.milestone.findMany({
    where: { project: { agencyId } },
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      dueDate: true,
      completedDate: true,
      project: { select: { id: true, name: true } },
    },
  });
  return buildMilestoneRollup(
    rows.map((m) => ({
      id: m.id,
      name: m.name,
      projectId: m.project.id,
      projectName: m.project.name,
      status: m.status,
      dueDate: m.dueDate,
      completedDate: m.completedDate,
    })),
    new Date(),
    period,
  );
}
