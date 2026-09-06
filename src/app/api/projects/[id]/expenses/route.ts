import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { expenseCreateSchema } from "@/lib/validation/expense";
import { formatCurrency } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, agencyId: auth.agencyId },
    select: { id: true, name: true },
  });
  if (!project) return fail("NOT_FOUND", "Project not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const expense = await prisma.projectExpense.create({
    data: {
      projectId,
      category: input.category,
      amount: input.amount,
      description: input.description,
      dateIncurred: new Date(input.dateIncurred),
      receiptUrl: input.receiptUrl || null,
      createdBy: auth.userId,
    },
    select: { id: true, amount: true, description: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "added_expense",
    entityType: "project_expense",
    entityId: expense.id,
    description: `Added ${formatCurrency(input.amount)} expense "${input.description}" to ${project.name}`,
    metadata: { projectId, category: input.category },
  });

  return ok(expense, { status: 201 });
}
