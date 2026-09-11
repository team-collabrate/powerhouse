import { DAY_MS, round1 } from "./shared";

export interface MilestoneRollupInput {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  status: string; // pending | in_progress | completed
  dueDate: Date;
  completedDate: Date | null;
}

export interface MilestoneRollupRow {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  status: string;
  dueDate: string; // ISO
  /** whole days from now; negative = overdue */
  daysAway: number;
}

export interface MilestoneRollup {
  /** open, due within the horizon, soonest first */
  upcoming: MilestoneRollupRow[];
  /** open, past due, most overdue first */
  overdue: MilestoneRollupRow[];
  /** completed with `completedDate` in [from, to); only when a period is given */
  completedInPeriod: number;
  /** of completed milestones, the share finished on or before their due date */
  onTimeRate: number | null;
}

const UPCOMING_HORIZON_DAYS = 30;

export function buildMilestoneRollup(
  milestones: MilestoneRollupInput[],
  now: Date,
  period?: { from: Date; to: Date },
): MilestoneRollup {
  const row = (m: MilestoneRollupInput): MilestoneRollupRow => ({
    id: m.id,
    name: m.name,
    projectId: m.projectId,
    projectName: m.projectName,
    status: m.status,
    dueDate: m.dueDate.toISOString(),
    daysAway: Math.floor((m.dueDate.getTime() - now.getTime()) / DAY_MS),
  });

  const open = milestones.filter((m) => m.status !== "completed");
  const horizon = now.getTime() + UPCOMING_HORIZON_DAYS * DAY_MS;

  const upcoming = open
    .filter((m) => m.dueDate >= now && m.dueDate.getTime() <= horizon)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map(row);

  const overdue = open
    .filter((m) => m.dueDate < now)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map(row);

  const completed = milestones.filter(
    (m) => m.status === "completed" && m.completedDate,
  );
  const completedInPeriod = period
    ? completed.filter(
        (m) =>
          (m.completedDate as Date) >= period.from &&
          (m.completedDate as Date) < period.to,
      ).length
    : completed.length;

  const onTime = completed.filter(
    (m) => (m.completedDate as Date) <= m.dueDate,
  ).length;

  return {
    upcoming,
    overdue,
    completedInPeriod,
    onTimeRate: completed.length
      ? round1((onTime / completed.length) * 100)
      : null,
  };
}
