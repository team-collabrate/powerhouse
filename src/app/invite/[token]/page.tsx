import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { AcceptInviteForm } from "@/components/team/AcceptInviteForm";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({
    where: { token },
    select: {
      email: true,
      role: true,
      acceptedAt: true,
      agency: { select: { name: true, brandColor: true, isActive: true } },
    },
  });

  const invalid = !invite || invite.acceptedAt || !invite.agency.isActive;
  const accent =
    invite && /^#[0-9a-fA-F]{6}$/.test(invite.agency.brandColor)
      ? invite.agency.brandColor
      : "#9933ff";

  return (
    <div className="grid min-h-screen place-items-center bg-surface-sunken px-4">
      <div className="w-full max-w-[400px] rounded-[var(--radius-md)] border border-hairline bg-surface p-8 shadow-[var(--shadow-card)]">
        {invalid ? (
          <>
            <h1 className="text-lg font-semibold text-ink">
              Invite link expired
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              This invitation has already been used or was revoked. Ask your
              agency admin for a new link.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-accent"
            >
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <span
              className="grid h-9 w-9 place-items-center rounded-[var(--radius-xs)] text-[15px] font-bold text-white"
              style={{ background: accent }}
            >
              {invite.agency.name.charAt(0)}
            </span>
            <h1 className="mt-4 text-lg font-semibold text-ink">
              Join {invite.agency.name}
            </h1>
            <p className="mt-1 text-sm text-ink-2">
              You&apos;ve been invited as{" "}
              <strong>{ROLE_LABELS[invite.role as Role] ?? invite.role}</strong>.
              Set a password to get started.
            </p>
            <AcceptInviteForm token={token} email={invite.email} />
          </>
        )}
      </div>
    </div>
  );
}
