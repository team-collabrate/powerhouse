import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireCapability("team:manage");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const invite = await prisma.invite.findFirst({
    where: { id, agencyId: auth.agencyId, acceptedAt: null },
    select: { id: true, email: true },
  });
  if (!invite) return fail("NOT_FOUND", "Invite not found", 404);

  await prisma.invite.delete({ where: { id } });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "revoked_invite",
    entityType: "invite",
    entityId: id,
    description: `Revoked invite for ${invite.email}`,
  });

  return ok({ id });
}
