import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { generatePortalToken } from "@/lib/portal";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const auth = await requireCapability("client:write");
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, agencyId: auth.agencyId },
    select: { id: true, companyName: true, portalToken: true },
  });
  if (!client) return fail("NOT_FOUND", "Client not found", 404);

  const token = generatePortalToken();
  await prisma.client.update({ where: { id }, data: { portalToken: token } });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: client.portalToken ? "regenerated_portal_link" : "created_portal_link",
    entityType: "client",
    entityId: id,
    description: `${client.portalToken ? "Regenerated" : "Created"} portal link for "${client.companyName}"`,
  });

  return ok({ token });
}
