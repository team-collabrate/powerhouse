import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import {
  uploadAgencyLogo,
  deleteAgencyLogo,
  LOGO_MAX_BYTES,
  LOGO_MIME_TYPES,
} from "@/lib/storage";

export async function POST(request: Request) {
  const auth = await requireCapability("settings:manage");
  if (auth instanceof NextResponse) return auth;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return fail("VALIDATION_ERROR", "No file provided", 400);
  }
  if (!LOGO_MIME_TYPES.includes(file.type as (typeof LOGO_MIME_TYPES)[number])) {
    return fail("VALIDATION_ERROR", "Use PNG, JPG, WEBP, or SVG", 400);
  }
  if (file.size > LOGO_MAX_BYTES) {
    return fail("VALIDATION_ERROR", "Max file size is 2MB", 400);
  }

  let url: string;
  try {
    ({ url } = await uploadAgencyLogo(auth.agencyId, file));
  } catch (err) {
    console.error("logo upload failed", err);
    return fail("UPLOAD_ERROR", "Could not upload the logo. Try again.", 502);
  }

  await prisma.agency.update({
    where: { id: auth.agencyId },
    data: { logoUrl: url },
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_settings",
    entityType: "agency",
    entityId: auth.agencyId,
    description: "Updated agency logo",
    metadata: { changed: ["logoUrl"] },
  });

  return ok({ logoUrl: url });
}

export async function DELETE() {
  const auth = await requireCapability("settings:manage");
  if (auth instanceof NextResponse) return auth;

  await prisma.agency.update({
    where: { id: auth.agencyId },
    data: { logoUrl: null },
  });
  await deleteAgencyLogo(auth.agencyId);

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "updated_settings",
    entityType: "agency",
    entityId: auth.agencyId,
    description: "Removed agency logo",
    metadata: { changed: ["logoUrl"] },
  });

  return ok({ ok: true });
}
