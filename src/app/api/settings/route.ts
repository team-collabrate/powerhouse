import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireSession, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { agencySettingsSchema } from "@/lib/validation/settings";
import { getAgencySettings } from "@/lib/queries/settings";

export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;
  const settings = await getAgencySettings(auth.agencyId);
  if (!settings) return fail("NOT_FOUND", "Agency not found", 404);
  return ok(settings);
}

export async function PATCH(request: Request) {
  const auth = await requireCapability("settings:manage");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = agencySettingsSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const d = parsed.data;

  await prisma.agency.update({
    where: { id: auth.agencyId },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.brandColor !== undefined && { brandColor: d.brandColor }),
      ...(d.logoUrl !== undefined && { logoUrl: d.logoUrl || null }),
      ...(d.monthlyRevenueTarget !== undefined && {
        monthlyRevenueTarget: d.monthlyRevenueTarget,
      }),
      ...(d.overheadMethod !== undefined && {
        overheadMethod: d.overheadMethod,
      }),
      ...(d.overheadRatePct !== undefined && {
        overheadRate: d.overheadRatePct / 100,
      }),
    },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_settings",
    entityType: "agency",
    entityId: auth.agencyId,
    description: "Updated agency settings",
    metadata: { changed: Object.keys(d) },
  });

  return ok({ ok: true });
}
