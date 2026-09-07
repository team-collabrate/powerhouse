import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/queries/invoices";

const today = () => new Date().toISOString().slice(0, 10);
const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const dueAfterIssue = (v: { issueDate?: string; dueDate?: string }) =>
  !v.issueDate || !v.dueDate || v.dueDate >= v.issueDate;
const dueError = {
  message: "Due date must be on or after the issue date",
  path: ["dueDate"] as string[],
};

// create just makes a draft shell — line items are added in the editor
export const invoiceCreateSchema = z
  .object({
    projectId: z.string().trim().min(1, "Select a project"),
    issueDate: dateStr,
    dueDate: dateStr,
  })
  .refine(dueAfterIssue, dueError);

export const lineItemSchema = z.object({
  description: z.string().trim().min(1, "Required").max(300),
  quantity: z.coerce.number().positive("Must be > 0").max(1_000_000),
  unitPrice: z.coerce.number().min(0, "Can't be negative").max(1e12),
});

// full editor save — draft only
export const invoiceEditSchema = z
  .object({
    issueDate: dateStr.optional(),
    dueDate: dateStr.optional(),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    taxRatePct: z.coerce.number().min(0).max(100),
    lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
  })
  .refine(dueAfterIssue, dueError);

// once sent, only notes + dueDate may change
export const invoiceUpdateSchema = z
  .object({
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
export type InvoiceEditInput = z.infer<typeof invoiceEditSchema>;
export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
