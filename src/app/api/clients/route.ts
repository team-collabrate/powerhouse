import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, validationError, requireSession , requireCapability} from "@/lib/api";
import { logActivity } from "@/lib/activity";

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

const createSchema = z.object({
  companyName: z.string().trim().min(1, "Required").max(255),
  name: z.string().trim().min(1, "Required").max(255),
  email: z.string().trim().email().max(255),
});

export async function POST(request: Request) {
  const auth = await requireCapability("client:write");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const client = await prisma.client.create({
    data: { agencyId: auth.agencyId, ...parsed.data },
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
