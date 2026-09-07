import { z } from "zod";
import { MILESTONE_STATUSES } from "@/lib/queries/milestones";

const base = z.object({
  name: z.string().trim().min(1, "Required").max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  status: z.enum(MILESTONE_STATUSES).default("pending"),
});

export const milestoneCreateSchema = base;
export const milestoneUpdateSchema = base.partial();

export type MilestoneCreateInput = z.infer<typeof milestoneCreateSchema>;
