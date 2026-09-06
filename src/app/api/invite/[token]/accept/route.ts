import { prisma } from "@/lib/prisma";
import { ok, fail, validationError } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { inviteAcceptSchema } from "@/lib/validation/team";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;

  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      role: true,
      acceptedAt: true,
      agency: { select: { id: true, name: true, isActive: true } },
    },
  });
  if (!invite || invite.acceptedAt || !invite.agency.isActive) {
    return fail("INVALID_INVITE", "This invite link is no longer valid", 410);
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteAcceptSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { fullName, password } = parsed.data;

  const admin = createAdminClient();
  if (!admin) {
    return fail(
      "NOT_CONFIGURED",
      "Accepting invites needs SUPABASE_SERVICE_ROLE_KEY to be set",
      500,
    );
  }

  // create a confirmed auth user (the inviting admin is vouching for them)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr || !created.user) {
    const msg = createErr?.message ?? "";
    return fail(
      "AUTH_ERROR",
      /registered|exists/i.test(msg)
        ? "That email already has an account — sign in instead."
        : msg || "Could not create the account",
      400,
    );
  }

  try {
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: created.user.id,
          email: invite.email,
          fullName,
          role: invite.role,
          agencyId: invite.agency.id,
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      }),
    ]);
  } catch (err) {
    console.error("invite accept: provisioning failed", err);
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    return fail("PROVISION_ERROR", "Something went wrong setting up the account", 500);
  }

  await logActivity({
    agencyId: invite.agency.id,
    userId: created.user.id,
    action: "accepted_invite",
    entityType: "user",
    entityId: created.user.id,
    description: `${fullName} joined as ${invite.role}`,
  });

  // sign them straight in
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: invite.email, password });

  return ok({ agencyName: invite.agency.name });
}
