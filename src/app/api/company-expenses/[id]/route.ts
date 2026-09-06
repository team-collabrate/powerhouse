import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { companyExpenseUpdateSchema } from "@/lib/validation/settings";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCapability("settings:manage");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await prisma.companyExpense.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, description: true },
  });
  if (!existing) return fail("NOT_FOUND", "Not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = companyExpenseUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;

  await prisma.companyExpense.update({
    where: { id },
    data: {
      ...(d.category !== undefined && { category: d.category }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.amount !== undefined && { amount: d.amount }),
      ...(d.dateIncurred !== undefined && {
        dateIncurred: new Date(d.dateIncurred),
      }),
      ...(d.isRecurring !== undefined && { isRecurring: d.isRecurring }),
      ...(d.recurringFrequency !== undefined && {
        recurringFrequency: d.recurringFrequency,
      }),
    },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_company_expense",
    entityType: "company_expense",
    entityId: id,
    description: `Updated overhead "${existing.description}"`,
  });

  return ok({ id });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCapability("settings:manage");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await prisma.companyExpense.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, description: true },
  });
  if (!existing) return fail("NOT_FOUND", "Not found", 404);

  await prisma.companyExpense.delete({ where: { id } });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "deleted_company_expense",
    entityType: "company_expense",
    entityId: id,
    description: `Deleted overhead "${existing.description}"`,
  });

  return ok({ id });
}
