import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { teamMemberUpdateSchema } from "@/lib/validation/team";
import { countActiveAdmins } from "@/lib/queries/settings";

type Params = { params: Promise<{ userId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireCapability("team:manage");
  if (auth instanceof NextResponse) return auth;
  const { userId } = await params;

  if (userId === auth.userId)
    return fail("INVALID_STATE", "You can't change your own role or status", 409);

  const member = await prisma.user.findFirst({
    where: { id: userId, agencyId: auth.agencyId },
    select: { id: true, fullName: true, role: true, isActive: true },
  });
  if (!member) return fail("NOT_FOUND", "Team member not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = teamMemberUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;

  // guard the last active admin
  const losingAdmin =
    member.role === "admin" &&
    member.isActive &&
    ((d.role !== undefined && d.role !== "admin") || d.isActive === false);
  if (losingAdmin && (await countActiveAdmins(auth.agencyId)) <= 1) {
    return fail("INVALID_STATE", "The agency needs at least one active admin", 409);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(d.role !== undefined && { role: d.role }),
      ...(d.isActive !== undefined && { isActive: d.isActive }),
    },
    select: { id: true, role: true, isActive: true },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_teammate",
    entityType: "user",
    entityId: userId,
    description: `Updated ${member.fullName}${d.role ? ` → ${d.role}` : ""}${
      d.isActive === false ? " (deactivated)" : d.isActive === true ? " (reactivated)" : ""
    }`,
    metadata: { changed: Object.keys(d) },
  });

  return ok(updated);
}
