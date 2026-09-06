import { z } from "zod";

const opt = z.string().trim().max(255).optional().or(z.literal(""));

const base = z.object({
  companyName: z.string().trim().min(1, "Required").max(255),
  name: z.string().trim().min(1, "Required").max(255),
  email: z.string().trim().email().max(255),
  phone: opt,
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: opt,
  country: opt,
});

export const clientCreateSchema = base;
export const clientUpdateSchema = base.partial().extend({
  isActive: z.boolean().optional(),
});

export type ClientCreateInput = z.infer<typeof clientCreateSchema>;
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>;
