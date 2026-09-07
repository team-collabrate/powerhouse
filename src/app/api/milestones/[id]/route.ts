import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { milestoneUpdateSchema } from "@/lib/validation/milestone";

type Params = { params: Promise<{ id: string }> };

async function loadOwned(agencyId: string, id: string) {
  return prisma.milestone.findFirst({
    where: { id, project: { agencyId } },
    select: {
      id: true,
      name: true,
      status: true,
      project: { select: { id: true, name: true } },
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCapability("project:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await loadOwned(auth.agencyId, id);
  if (!existing) return fail("NOT_FOUND", "Milestone not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = milestoneUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const nextStatus = input.status ?? existing.status;
  const completedDate =
    input.status === undefined
      ? undefined
      : nextStatus === "completed"
        ? new Date()
        : null;

  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description || null,
      }),
      ...(input.dueDate !== undefined && { dueDate: new Date(input.dueDate) }),
      ...(input.status !== undefined && { status: input.status }),
      ...(completedDate !== undefined && { completedDate }),
    },
    select: { id: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_milestone",
    entityType: "milestone",
    entityId: id,
    description: `Updated milestone "${existing.name}" on ${existing.project.name}`,
    metadata: { changed: Object.keys(input) },
  });

  return ok(milestone);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCapability("project:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await loadOwned(auth.agencyId, id);
  if (!existing) return fail("NOT_FOUND", "Milestone not found", 404);

  await prisma.milestone.delete({ where: { id } });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "deleted_milestone",
    entityType: "milestone",
    entityId: id,
    description: `Deleted milestone "${existing.name}" from ${existing.project.name}`,
    metadata: { projectId: existing.project.id },
  });

  return ok({ id });
}
