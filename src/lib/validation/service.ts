import { z } from "zod";
import { SERVICE_COLORS } from "@/lib/services";

const color = z
  .string()
  .trim()
  .refine((v) => SERVICE_COLORS.includes(v), "Pick one of the offered colours");

export const serviceCreateSchema = z.object({
  name: z.string().trim().min(1, "Required").max(60),
  // no colour picker in the UI anymore; auto-assigned server-side
  color: color.optional(),
});

export const serviceUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(60).optional(),
    color: color.optional(),
    isActive: z.coerce.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
