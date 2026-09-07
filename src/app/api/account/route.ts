import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, validationError, requireSession } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { accountUpdateSchema } from "@/lib/validation/account";

export async function PATCH(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = accountUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  await prisma.user.update({
    where: { id: auth.userId },
    data: { fullName: parsed.data.fullName },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_account",
    entityType: "user",
    entityId: auth.userId,
    description: `${parsed.data.fullName} updated their profile`,
  });

  return ok({ ok: true });
}
