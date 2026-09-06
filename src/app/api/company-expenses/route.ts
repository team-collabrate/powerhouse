import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, validationError, requireSession, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { companyExpenseCreateSchema } from "@/lib/validation/settings";
import { listCompanyExpenses } from "@/lib/queries/settings";
import { formatCurrency } from "@/lib/format";

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  return ok(await listCompanyExpenses(auth.agencyId));
}

export async function POST(request: Request) {
  const auth = await requireCapability("settings:manage");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = companyExpenseCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;

  const row = await prisma.companyExpense.create({
    data: {
      agencyId: auth.agencyId,
      category: d.category,
      description: d.description,
      amount: d.amount,
      dateIncurred: new Date(d.dateIncurred),
      isRecurring: d.isRecurring,
      recurringFrequency: d.isRecurring ? d.recurringFrequency ?? null : null,
      createdBy: auth.userId,
    },
    select: { id: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "added_company_expense",
    entityType: "company_expense",
    entityId: row.id,
    description: `Added ${formatCurrency(d.amount)} overhead "${d.description}"`,
  });

  return ok(row, { status: 201 });
}
