import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { projectUpdateSchema } from "@/lib/validation/project";
import { getProject } from "@/lib/queries/projects";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const project = await getProject(auth.agencyId, id);
  if (!project) return fail("NOT_FOUND", "Project not found", 404);
  return ok(project);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await prisma.project.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true },
  });
  if (!existing) return fail("NOT_FOUND", "Project not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = projectUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  if (input.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: input.clientId, agencyId: auth.agencyId },
      select: { id: true },
    });
    if (!client) return fail("INVALID_CLIENT", "Unknown client", 400);
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.clientId !== undefined && { clientId: input.clientId }),
      ...(input.description !== undefined && {
        description: input.description || null,
      }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.serviceType !== undefined && { serviceType: input.serviceType }),
      ...(input.contractValue !== undefined && {
        contractValue: input.contractValue,
      }),
      ...(input.allocatedOverhead !== undefined && {
        allocatedOverhead: input.allocatedOverhead,
      }),
      ...(input.progressPercentage !== undefined && {
        progressPercentage: input.progressPercentage,
      }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ? new Date(input.startDate) : null,
      }),
      ...(input.deadline !== undefined && {
        deadline: input.deadline ? new Date(input.deadline) : null,
      }),
    },
    select: { id: true, name: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_project",
    entityType: "project",
    entityId: id,
    description: `Updated project "${project.name}"`,
    metadata: { changed: Object.keys(input) },
  });

  return ok(project);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await prisma.project.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, name: true },
  });
  if (!existing) return fail("NOT_FOUND", "Project not found", 404);

  // soft delete — never hard-delete (audit trail + linked invoices)
  await prisma.project.update({ where: { id }, data: { status: "closed" } });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "closed_project",
    entityType: "project",
    entityId: id,
    description: `Closed project "${existing.name}"`,
  });

  return ok({ id, status: "closed" });
}
