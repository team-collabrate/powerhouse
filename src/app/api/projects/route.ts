import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { projectCreateSchema } from "@/lib/validation/project";
import { listProjects, type ProjectStatus } from "@/lib/queries/projects";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const result = await listProjects(auth.agencyId, {
    status: (searchParams.get("status") as ProjectStatus | "all") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  return ok(result);
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const input = parsed.data;

  // client must belong to the same agency
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, agencyId: auth.agencyId },
    select: { id: true },
  });
  if (!client) return fail("INVALID_CLIENT", "Unknown client", 400);

  const project = await prisma.project.create({
    data: {
      agencyId: auth.agencyId,
      clientId: input.clientId,
      name: input.name,
      description: input.description || null,
      status: input.status,
      serviceType: input.serviceType,
      contractValue: input.contractValue,
      teamCost: input.teamCost,
      allocatedOverhead: input.allocatedOverhead,
      progressPercentage: input.progressPercentage,
      startDate: input.startDate ? new Date(input.startDate) : null,
      deadline: input.deadline ? new Date(input.deadline) : null,
    },
    select: { id: true, name: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "created_project",
    entityType: "project",
    entityId: project.id,
    description: `Created project "${project.name}"`,
  });

  return ok(project, { status: 201 });
}
