/* Pure validation + assembly of the 4 import CSVs into a normalised plan.
   No Prisma here: takes plain header→value row objects (from csvToObjects)
   and returns either row-level errors or a ready-to-commit plan. Tested in
   scripts/check-dashboard.ts, no DB needed. */
import { z } from "zod";
import { invoiceTotals } from "@/lib/invoice-total";

const PROJECT_STATUSES = ["active", "in_review", "delivered", "closed"] as const;
const INVOICE_STATUSES = ["draft", "sent", "cancelled"] as const;
const PAYMENT_METHODS = ["bank_transfer", "card", "cheque", "cash", "other"] as const;

// payment_date is never defaulted: a payment's date drives DSO/aging/cash-
// flow reporting directly, so guessing "today" for a historical payment
// would silently misdate real money; this must come from the source data.
const paymentDateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Missing or invalid date. Use YYYY-MM-DD. If the exact date isn't known, use your best estimate (e.g. month-end) rather than leaving it blank.");
const optDateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? v : undefined));
const num = (msg = "Must be a number") =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number({ message: msg }),
  );

const clientRowSchema = z.object({
  client_ref: z.string().trim().min(1, "Required"),
  company_name: z.string().trim().min(1, "Required").max(255),
  name: z.string().trim().min(1, "Required").max(255),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  city: z.string().trim().max(255).optional().or(z.literal("")),
  country: z.string().trim().max(255).optional().or(z.literal("")),
});

const projectRowSchema = z.object({
  project_ref: z.string().trim().min(1, "Required"),
  client_ref: z.string().trim().min(1, "Required"),
  name: z.string().trim().min(1, "Required").max(255),
  service: z.string().trim().min(1).max(60).default("other"),
  status: z.enum(PROJECT_STATUSES).default("active"),
  contract_value: num("contract_value must be a number").pipe(z.number().positive("Must be > 0")),
  team_cost: num().pipe(z.number().min(0)).default(0),
  start_date: optDateStr,
  deadline: optDateStr,
  progress_percentage: num().pipe(z.number().int().min(0).max(100)).default(0),
});

const invoiceRowSchema = z.object({
  invoice_ref: z.string().trim().min(1, "Required"),
  project_ref: z.string().trim().min(1, "Required"),
  invoice_number: z.string().trim().max(50).optional().or(z.literal("")),
  // Both dates are optional at the row-parse stage; a real due_date is
  // required by the DB, but rather than reject the whole file over a blank
  // cell, buildImportPlan below fills it in: due_date from issue_date (or
  // today), issue_date from due_date (or today). Only genuinely-missing
  // money events (payments) are left un-guessed.
  issue_date: optDateStr,
  due_date: optDateStr,
  status: z.enum(INVOICE_STATUSES).default("sent"),
  tax_rate_pct: num().pipe(z.number().min(0).max(100)).default(0),
  line_description: z.string().trim().min(1, "Required").max(300),
  quantity: num("quantity must be a number").pipe(z.number().positive("Must be > 0")),
  unit_price: num("unit_price must be a number").pipe(z.number().min(0)),
});

const paymentRowSchema = z.object({
  invoice_ref: z.string().trim().min(1, "Required"),
  amount: num("amount must be a number").pipe(z.number().positive("Must be > 0")),
  payment_date: paymentDateStr,
  payment_method: z.enum(PAYMENT_METHODS).default("other"),
  reference_number: z.string().trim().max(255).optional().or(z.literal("")),
});

export interface ImportRowError {
  file: "clients" | "projects" | "invoices" | "payments";
  row: number; // 1-based, matches spreadsheet row (header = row 1)
  message: string;
}

export interface PlanClient {
  ref: string;
  companyName: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}
export interface PlanProject {
  ref: string;
  clientRef: string;
  name: string;
  serviceType: string;
  status: (typeof PROJECT_STATUSES)[number];
  contractValue: number;
  teamCost: number;
  startDate?: string;
  deadline?: string;
  progressPercentage: number;
}
export interface PlanInvoice {
  ref: string;
  projectRef: string;
  invoiceNumber?: string;
  issueDate: string;
  dueDate: string;
  status: (typeof INVOICE_STATUSES)[number];
  taxRatePct: number;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
}
export interface PlanPayment {
  invoiceRef: string;
  amount: number;
  paymentDate: string;
  paymentMethod: (typeof PAYMENT_METHODS)[number];
  referenceNumber?: string;
}

export interface ImportPlan {
  clients: PlanClient[];
  projects: PlanProject[];
  invoices: PlanInvoice[];
  payments: PlanPayment[];
}

export interface ImportBuildResult {
  plan: ImportPlan;
  counts: { clients: number; projects: number; invoices: number; payments: number };
  errors: ImportRowError[];
  warnings: ImportRowError[];
}

/** Today as YYYY-MM-DD, in the server's local date, used only as a last-
 * resort fallback when a row gives us no date to work with at all. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const MAX_ROWS_PER_FILE = 5000;

function validateRows<T extends z.ZodTypeAny>(
  file: ImportRowError["file"],
  rows: Record<string, string>[],
  schema: T,
  errors: ImportRowError[],
): z.infer<T>[] {
  const out: z.infer<T>[] = [];
  rows.slice(0, MAX_ROWS_PER_FILE).forEach((raw, i) => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          file,
          row: i + 2,
          message: `${issue.path.join(".") || file}: ${issue.message}`,
        });
      }
      return;
    }
    out.push(parsed.data);
  });
  if (rows.length > MAX_ROWS_PER_FILE) {
    errors.push({ file, row: MAX_ROWS_PER_FILE + 2, message: `Only the first ${MAX_ROWS_PER_FILE} rows were checked. Split this file.` });
  }
  return out;
}

export function buildImportPlan(input: {
  clientRows: Record<string, string>[];
  projectRows: Record<string, string>[];
  invoiceRows: Record<string, string>[];
  paymentRows: Record<string, string>[];
}): ImportBuildResult {
  const errors: ImportRowError[] = [];
  const warnings: ImportRowError[] = [];

  const clientRows = validateRows("clients", input.clientRows, clientRowSchema, errors);
  const projectRows = validateRows("projects", input.projectRows, projectRowSchema, errors);
  const invoiceRows = validateRows("invoices", input.invoiceRows, invoiceRowSchema, errors);
  const paymentRows = validateRows("payments", input.paymentRows, paymentRowSchema, errors);

  const clientRefs = new Set<string>();
  const clients: PlanClient[] = [];
  clientRows.forEach((r, i) => {
    if (clientRefs.has(r.client_ref)) {
      errors.push({ file: "clients", row: i + 2, message: `Duplicate client_ref "${r.client_ref}"` });
      return;
    }
    clientRefs.add(r.client_ref);
    clients.push({
      ref: r.client_ref,
      companyName: r.company_name,
      name: r.name,
      email: r.email,
      phone: r.phone || undefined,
      address: r.address || undefined,
      city: r.city || undefined,
      country: r.country || undefined,
    });
  });

  const projectRefs = new Set<string>();
  const projects: PlanProject[] = [];
  projectRows.forEach((r, i) => {
    if (!clientRefs.has(r.client_ref)) {
      errors.push({ file: "projects", row: i + 2, message: `Unknown client_ref "${r.client_ref}"` });
      return;
    }
    if (projectRefs.has(r.project_ref)) {
      errors.push({ file: "projects", row: i + 2, message: `Duplicate project_ref "${r.project_ref}"` });
      return;
    }
    projectRefs.add(r.project_ref);
    projects.push({
      ref: r.project_ref,
      clientRef: r.client_ref,
      name: r.name,
      serviceType: r.service,
      status: r.status,
      contractValue: r.contract_value,
      teamCost: r.team_cost,
      startDate: r.start_date,
      deadline: r.deadline,
      progressPercentage: r.progress_percentage,
    });
  });

  const invoiceByRef = new Map<string, PlanInvoice>();
  const invoiceOrder: string[] = [];
  invoiceRows.forEach((r, i) => {
    if (!projectRefs.has(r.project_ref)) {
      errors.push({ file: "invoices", row: i + 2, message: `Unknown project_ref "${r.project_ref}"` });
      return;
    }
    const existing = invoiceByRef.get(r.invoice_ref);
    if (existing) {
      // Repeat rows are usually extra line items on the same invoice, and
      // often only carry the description/qty/price; a blank date/status on
      // a repeat row is not a conflict, only a genuinely different non-blank
      // value is.
      if (
        existing.projectRef !== r.project_ref ||
        (r.due_date && existing.dueDate !== r.due_date)
      ) {
        errors.push({
          file: "invoices",
          row: i + 2,
          message: `invoice_ref "${r.invoice_ref}" repeated with a different project_ref/due_date; line items on the same invoice must share those`,
        });
        return;
      }
      existing.lineItems.push({
        description: r.line_description,
        quantity: r.quantity,
        unitPrice: r.unit_price,
      });
      return;
    }

    // Neither date is required on the sheet: due_date falls back to
    // issue_date (an invoice is at minimum "due when issued"), and if
    // NEITHER is given at all, both fall back to today rather than
    // blocking the whole import over one missing cell; flagged as a
    // warning so it's visible before committing, not silently invented.
    let dueDate = r.due_date;
    let issueDate = r.issue_date;
    if (!dueDate && !issueDate) {
      dueDate = todayIso();
      issueDate = dueDate;
      warnings.push({
        file: "invoices",
        row: i + 2,
        message: `invoice_ref "${r.invoice_ref}" had no issue_date or due_date; used today's date (${dueDate})`,
      });
    } else if (!dueDate) {
      dueDate = issueDate!;
      warnings.push({
        file: "invoices",
        row: i + 2,
        message: `invoice_ref "${r.invoice_ref}" had no due_date; used its issue_date (${dueDate})`,
      });
    } else if (!issueDate) {
      issueDate = dueDate;
      warnings.push({
        file: "invoices",
        row: i + 2,
        message: `invoice_ref "${r.invoice_ref}" had no issue_date; used its due_date (${issueDate})`,
      });
    }

    invoiceByRef.set(r.invoice_ref, {
      ref: r.invoice_ref,
      projectRef: r.project_ref,
      invoiceNumber: r.invoice_number || undefined,
      issueDate: issueDate!,
      dueDate: dueDate!,
      status: r.status,
      taxRatePct: r.tax_rate_pct,
      lineItems: [{ description: r.line_description, quantity: r.quantity, unitPrice: r.unit_price }],
    });
    invoiceOrder.push(r.invoice_ref);
  });
  const invoices = invoiceOrder.map((ref) => invoiceByRef.get(ref)!);
  const invoiceRefs = new Set(invoices.map((inv) => inv.ref));

  const payments: PlanPayment[] = [];
  paymentRows.forEach((r, i) => {
    if (!invoiceRefs.has(r.invoice_ref)) {
      errors.push({ file: "payments", row: i + 2, message: `Unknown invoice_ref "${r.invoice_ref}"` });
      return;
    }
    payments.push({
      invoiceRef: r.invoice_ref,
      amount: r.amount,
      paymentDate: r.payment_date,
      paymentMethod: r.payment_method,
      referenceNumber: r.reference_number || undefined,
    });
  });

  // touch invoiceTotals so a malformed invoice (e.g. all-zero line items) surfaces here, not mid-commit
  for (const inv of invoices) {
    invoiceTotals(inv.lineItems, inv.taxRatePct);
  }

  return {
    plan: { clients, projects, invoices, payments },
    counts: {
      clients: clients.length,
      projects: projects.length,
      invoices: invoices.length,
      payments: payments.length,
    },
    errors,
    warnings,
  };
}
