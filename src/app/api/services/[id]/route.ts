import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { serviceUpdateSchema } from "@/lib/validation/service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCapability("project:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const svc = await prisma.service.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, name: true },
  });
  if (!svc) return fail("NOT_FOUND", "Service not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = serviceUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;

  if (d.name) {
    const clash = await prisma.service.findFirst({
      where: {
        agencyId: auth.agencyId,
        id: { not: id },
        name: { equals: d.name, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (clash) return fail("ALREADY_EXISTS", "That name is taken", 409);
  }

  await prisma.service.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.color !== undefined && { color: d.color }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_service",
    entityType: "service",
    entityId: id,
    description:
      d.isActive === false
        ? `Hid service "${svc.name}"`
        : `Updated service "${d.name ?? svc.name}"`,
  });

  return ok({ ok: true });
}
