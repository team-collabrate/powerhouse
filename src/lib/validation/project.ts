import { z } from "zod";
import { PROJECT_STATUSES, SERVICE_TYPES } from "@/lib/queries/projects";

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));

const base = z.object({
  name: z.string().trim().min(1, "Required").max(255),
  clientId: z.string().trim().min(1, "Select a client"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(PROJECT_STATUSES).default("active"),
  serviceType: z.enum(SERVICE_TYPES).default("other"),
  contractValue: z.coerce.number().positive("Must be greater than 0"),
  allocatedOverhead: z.coerce.number().min(0).default(0),
  progressPercentage: z.coerce.number().int().min(0).max(100).default(0),
  startDate: dateString,
  deadline: dateString,
});

const deadlineAfterStart = (v: {
  startDate?: string;
  deadline?: string;
}) => !v.startDate || !v.deadline || v.deadline >= v.startDate;
const deadlineError = {
  message: "Deadline must be on or after the start date",
  path: ["deadline"] as string[],
};

export const projectCreateSchema = base.refine(deadlineAfterStart, deadlineError);
export const projectUpdateSchema = base
  .partial()
  .refine(deadlineAfterStart, deadlineError);

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
