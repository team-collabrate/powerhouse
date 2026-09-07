import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { milestoneCreateSchema } from "@/lib/validation/milestone";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireCapability("project:write");
  if (auth instanceof NextResponse) return auth;
  const { id: projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, agencyId: auth.agencyId },
    select: { id: true, name: true },
  });
  if (!project) return fail("NOT_FOUND", "Project not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = milestoneCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  const milestone = await prisma.milestone.create({
    data: {
      projectId,
      name: input.name,
      description: input.description || null,
      dueDate: new Date(input.dueDate),
      status: input.status,
      completedDate: input.status === "completed" ? new Date() : null,
    },
    select: { id: true, name: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "added_milestone",
    entityType: "milestone",
    entityId: milestone.id,
    description: `Added milestone "${input.name}" to ${project.name}`,
    metadata: { projectId },
  });

  return ok(milestone, { status: 201 });
}
