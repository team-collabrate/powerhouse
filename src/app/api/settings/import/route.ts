import { NextResponse } from "next/server";
import { ok, fail, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { csvToObjects } from "@/lib/import/csv";
import { buildImportPlan } from "@/lib/import/build-plan";
import { commitImportPlan } from "@/lib/queries/import";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function readCsv(form: FormData, key: string): Promise<Record<string, string>[] | null> {
  const file = form.get(key);
  if (!file || !(file instanceof File)) return null;
  if (file.size > MAX_FILE_BYTES) throw new Error(`${key}.csv is too large (max 5MB)`);
  return csvToObjects(await file.text());
}

export async function POST(request: Request) {
  const auth = await requireCapability("settings:manage");
  if (auth instanceof NextResponse) return auth;

  const form = await request.formData().catch(() => null);
  if (!form) return fail("VALIDATION_ERROR", "Expected multipart form data", 400);

  let clientRows: Record<string, string>[];
  let projectRows: Record<string, string>[];
  let invoiceRows: Record<string, string>[];
  let paymentRows: Record<string, string>[];
  try {
    clientRows = (await readCsv(form, "clients")) ?? [];
    projectRows = (await readCsv(form, "projects")) ?? [];
    invoiceRows = (await readCsv(form, "invoices")) ?? [];
    paymentRows = (await readCsv(form, "payments")) ?? [];
  } catch (err) {
    return fail("VALIDATION_ERROR", err instanceof Error ? err.message : "Could not read the files", 400);
  }

  if (clientRows.length === 0 && projectRows.length === 0) {
    return fail("VALIDATION_ERROR", "Upload at least clients.csv and projects.csv", 400);
  }

  const { plan, counts, errors, warnings } = buildImportPlan({
    clientRows,
    projectRows,
    invoiceRows,
    paymentRows,
  });

  if (errors.length > 0) {
    return fail("VALIDATION_ERROR", `${errors.length} row(s) need fixing before this can be imported`, 400, {
      errors,
      warnings,
      counts,
    });
  }

  const commit = form.get("commit") === "true";
  if (!commit) {
    return ok({ committed: false, counts, warnings });
  }

  try {
    const summary = await commitImportPlan(auth.agencyId, auth.userId, plan);
    await logActivity({
      agencyId: auth.agencyId,
      userId: auth.userId,
      action: "imported_data",
      entityType: "agency",
      entityId: auth.agencyId,
      description: `Imported ${summary.clients} clients, ${summary.projects} projects, ${summary.invoices} invoices, ${summary.payments} payments`,
      metadata: { ...summary },
    });
    return ok({ committed: true, counts: summary, warnings });
  } catch (err) {
    console.error("import commit failed", err);
    return fail("IMPORT_ERROR", "Could not save the import. Nothing was changed.", 502);
  }
}
