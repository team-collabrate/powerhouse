import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { ok, fail, validationError, requireCapability } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { inviteCreateSchema } from "@/lib/validation/team";
import { appUrl, sendInviteEmail } from "@/lib/email";
import { ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";

export async function POST(request: Request) {
  const auth = await requireCapability("team:manage");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => null);
  const parsed = inviteCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { email, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { agencyId: true },
  });
  if (existingUser) {
    return fail(
      "ALREADY_EXISTS",
      existingUser.agencyId === auth.agencyId
        ? "That email is already on your team"
        : "That email already has an account elsewhere",
      409,
    );
  }

  const pending = await prisma.invite.findFirst({
    where: { agencyId: auth.agencyId, email, acceptedAt: null },
    select: { id: true },
  });
  if (pending)
    return fail("ALREADY_EXISTS", "There's already a pending invite for that email", 409);

  const token = randomBytes(18).toString("base64url");
  const invite = await prisma.invite.create({
    data: {
      agencyId: auth.agencyId,
      email,
      role,
      token,
      invitedBy: auth.userId,
    },
    select: { id: true },
  });

  const link = `${appUrl}/invite/${token}`;
  const agency = await prisma.agency.findUnique({
    where: { id: auth.agencyId },
    select: { name: true, replyToEmail: true },
  });
  const emailResult = await sendInviteEmail({
    to: email,
    agencyName: agency?.name ?? "your agency",
    role: ROLE_LABELS[role as Role] ?? role,
    inviteUrl: link,
    replyTo: agency?.replyToEmail,
  });

  await logActivity({
    agencyId: auth.agencyId,
    userId: auth.userId,
    action: "invited_teammate",
    entityType: "invite",
    entityId: invite.id,
    description: `Invited ${email} as ${role}`,
    metadata: { emailDelivered: emailResult.delivered },
  });

  return ok({ id: invite.id, token, link, ...emailResult }, { status: 201 });
}
