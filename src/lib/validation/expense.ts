import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/lib/queries/expenses";

const today = () => new Date().toISOString().slice(0, 10);

const base = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().positive("Must be greater than 0"),
  description: z.string().trim().min(1, "Required").max(255),
  dateIncurred: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((v) => v <= today(), "Cannot be in the future"),
  receiptUrl: z.string().trim().url().max(1000).optional().or(z.literal("")),
});

export const expenseCreateSchema = base;
export const expenseUpdateSchema = base.partial();

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
