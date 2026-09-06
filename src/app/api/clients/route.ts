import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, validationError, requireSession, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { clientCreateSchema } from "@/lib/validation/client";

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const clients = await prisma.client.findMany({
    where: { agencyId: auth.agencyId, isActive: true },
    orderBy: { companyName: "asc" },
    select: { id: true, name: true, companyName: true },
  });
  return ok(
    clients.map((c) => ({
      id: c.id,
      label: c.companyName ?? c.name,
      contact: c.name,
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireCapability("client:write");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = clientCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;

  const client = await prisma.client.create({
    data: {
      agencyId: auth.agencyId,
      companyName: d.companyName,
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      address: d.address || null,
      city: d.city || null,
      country: d.country || null,
    },
    select: { id: true, name: true, companyName: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "created_client",
    entityType: "client",
    entityId: client.id,
    description: `Added client "${client.companyName}"`,
  });

  return ok(
    { id: client.id, label: client.companyName ?? client.name, contact: client.name },
    { status: 201 },
  );
}
