import { z } from "zod";
import {
  COMPANY_EXPENSE_CATEGORIES,
  RECURRING_FREQUENCIES,
} from "@/lib/queries/settings";

export const agencySettingsSchema = z
  .object({
    name: z.string().trim().min(1, "Required").max(255).optional(),
    brandColor: z
      .string()
      .trim()
      .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #5cd65c")
      .optional(),
    logoUrl: z.string().trim().url().max(1000).optional().or(z.literal("")),
    monthlyRevenueTarget: z.coerce.number().min(0).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");

const today = () => new Date().toISOString().slice(0, 10);

const companyExpenseBase = z
  .object({
    category: z.enum(COMPANY_EXPENSE_CATEGORIES),
    description: z.string().trim().min(1, "Required").max(255),
    amount: z.coerce.number().positive("Must be greater than 0"),
    dateIncurred: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .refine((v) => v <= today(), "Cannot be in the future"),
    isRecurring: z.coerce.boolean().default(false),
    recurringFrequency: z.enum(RECURRING_FREQUENCIES).optional(),
  })
  .refine((v) => !v.isRecurring || !!v.recurringFrequency, {
    message: "Pick how often it recurs",
    path: ["recurringFrequency"],
  });

export const companyExpenseCreateSchema = companyExpenseBase;
export const companyExpenseUpdateSchema = z
  .object({
    category: z.enum(COMPANY_EXPENSE_CATEGORIES).optional(),
    description: z.string().trim().min(1).max(255).optional(),
    amount: z.coerce.number().positive().optional(),
    dateIncurred: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    isRecurring: z.coerce.boolean().optional(),
    recurringFrequency: z.enum(RECURRING_FREQUENCIES).nullable().optional(),
  });

export type AgencySettingsInput = z.infer<typeof agencySettingsSchema>;
export type CompanyExpenseCreateInput = z.infer<
  typeof companyExpenseCreateSchema
>;
