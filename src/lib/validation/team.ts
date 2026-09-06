import { z } from "zod";

/** Roles that can be assigned to a teammate (not "client"). */
export const ASSIGNABLE_ROLES = ["admin", "manager", "team_member"] as const;

export const inviteCreateSchema = z.object({
  email: z.string().trim().email().max(255).toLowerCase(),
  role: z.enum(ASSIGNABLE_ROLES),
});

export const teamMemberUpdateSchema = z
  .object({
    role: z.enum(ASSIGNABLE_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, "Nothing to update");

export const inviteAcceptSchema = z.object({
  fullName: z.string().trim().min(1, "Required").max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
});

export type InviteCreateInput = z.infer<typeof inviteCreateSchema>;
export type InviteAcceptInput = z.infer<typeof inviteAcceptSchema>;
