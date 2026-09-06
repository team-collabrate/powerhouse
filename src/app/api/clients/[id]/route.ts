import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { clientUpdateSchema } from "@/lib/validation/client";
import { getClient } from "@/lib/queries/clients";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const client = await getClient(auth.agencyId, id);
  if (!client) return fail("NOT_FOUND", "Client not found", 404);
  return ok(client);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCapability("client:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await prisma.client.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, companyName: true },
  });
  if (!existing) return fail("NOT_FOUND", "Client not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = clientUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(d.companyName !== undefined && { companyName: d.companyName }),
      ...(d.name !== undefined && { name: d.name }),
      ...(d.email !== undefined && { email: d.email }),
      ...(d.phone !== undefined && { phone: d.phone || null }),
      ...(d.address !== undefined && { address: d.address || null }),
      ...(d.city !== undefined && { city: d.city || null }),
      ...(d.country !== undefined && { country: d.country || null }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
    select: { id: true, companyName: true, isActive: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: d.isActive === false ? "deactivated_client" : "updated_client",
    entityType: "client",
    entityId: id,
    description:
      d.isActive === false
        ? `Deactivated client "${client.companyName}"`
        : `Updated client "${client.companyName}"`,
    metadata: { changed: Object.keys(d) },
  });

  return ok(client);
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCapability("client:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const existing = await prisma.client.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, companyName: true },
  });
  if (!existing) return fail("NOT_FOUND", "Client not found", 404);

  // soft delete — projects and invoices keep referring to the client
  await prisma.client.update({ where: { id }, data: { isActive: false } });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "deactivated_client",
    entityType: "client",
    entityId: id,
    description: `Deactivated client "${existing.companyName}"`,
  });

  return ok({ id, isActive: false });
}
