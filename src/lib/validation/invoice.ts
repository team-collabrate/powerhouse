import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/queries/invoices";

const today = () => new Date().toISOString().slice(0, 10);
const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const invoiceBase = z.object({
  projectId: z.string().trim().min(1, "Select a project"),
  amount: z.coerce.number().positive("Must be greater than 0"),
  issueDate: dateStr,
  dueDate: dateStr,
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

const dueAfterIssue = (v: { issueDate?: string; dueDate?: string }) =>
  !v.issueDate || !v.dueDate || v.dueDate >= v.issueDate;
const dueError = {
  message: "Due date must be on or after the issue date",
  path: ["dueDate"] as string[],
};

export const invoiceCreateSchema = invoiceBase.refine(dueAfterIssue, dueError);

// once sent, only notes + dueDate may change
export const invoiceUpdateSchema = z
  .object({
    amount: z.coerce.number().positive().optional(),
    issueDate: dateStr.optional(),
    dueDate: dateStr.optional(),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine(dueAfterIssue, dueError);

export const paymentCreateSchema = z.object({
  amount: z.coerce.number().positive("Must be greater than 0"),
  paymentDate: dateStr.refine((v) => v <= today(), "Cannot be in the future"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  referenceNumber: z.string().trim().max(255).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
