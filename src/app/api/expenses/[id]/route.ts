import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireCapability} from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { expenseUpdateSchema } from "@/lib/validation/expense";

type Params = { params: Promise<{ id: string }> };

async function loadOwned(agencyId: string, id: string) {
  return prisma.projectExpense.findFirst({
    where: { id, project: { agencyId } },
    select: { id: true, description: true, project: { select: { id: true, name: true } } },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCapability("expense:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await loadOwned(auth.agencyId, id);
  if (!existing) return fail("NOT_FOUND", "Expense not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = expenseUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const expense = await prisma.projectExpense.update({
    where: { id },
    data: {
      ...(input.category !== undefined && { category: input.category }),
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.dateIncurred !== undefined && {
        dateIncurred: new Date(input.dateIncurred),
      }),
      ...(input.receiptUrl !== undefined && {
        receiptUrl: input.receiptUrl || null,
      }),
    },
    select: { id: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_expense",
    entityType: "project_expense",
    entityId: id,
    description: `Updated expense "${existing.description}" on ${existing.project.name}`,
    metadata: { changed: Object.keys(input) },
  });

  return ok(expense);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCapability("expense:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await loadOwned(auth.agencyId, id);
  if (!existing) return fail("NOT_FOUND", "Expense not found", 404);

  await prisma.projectExpense.delete({ where: { id } });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "deleted_expense",
    entityType: "project_expense",
    entityId: id,
    description: `Deleted expense "${existing.description}" from ${existing.project.name}`,
    metadata: { projectId: existing.project.id },
  });

  return ok({ id });
}
