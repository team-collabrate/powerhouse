import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { serviceCreateSchema } from "@/lib/validation/service";
import { getServices } from "@/lib/queries/services";
import { slugifyService } from "@/lib/services";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const all = new URL(request.url).searchParams.get("all") === "1";
  const services = await getServices(auth.agencyId);
  return ok(all ? services : services.filter((s) => s.isActive));
}

export async function POST(request: Request) {
  const auth = await requireCapability("project:write");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = serviceCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { name, color } = parsed.data;

  const existing = await prisma.service.findMany({
    where: { agencyId: auth.agencyId },
    select: { slug: true, name: true, position: true },
  });
  if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    return fail("ALREADY_EXISTS", "A service with that name already exists", 409);
  }

  // unique slug within the agency
  const base = slugifyService(name);
  let slug = base;
  for (let i = 2; existing.some((s) => s.slug === slug); i++) slug = `${base}_${i}`;

  const position = existing.reduce((m, s) => Math.max(m, s.position), -1) + 1;

  const row = await prisma.service.create({
    data: { agencyId: auth.agencyId, slug, name, color, position },
    select: { id: true, slug: true, name: true, color: true, position: true, isActive: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "added_service",
    entityType: "service",
    entityId: row.id,
    description: `Added service "${name}"`,
  });

  return ok(row, { status: 201 });
}
