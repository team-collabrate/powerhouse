export const MILESTONE_STATUSES = [
  "pending",
  "in_progress",
  "completed",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
};

export interface MilestoneRow {
  id: string;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  dueDate: string;
  completedDate: string | null;
}
