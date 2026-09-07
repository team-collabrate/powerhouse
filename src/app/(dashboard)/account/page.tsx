import { getSessionContext } from "@/lib/session";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { AccountForm } from "@/components/account/AccountForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">
          Sign in to manage your account
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
          Account
        </h2>
        <p className="mt-1 text-[13px] text-ink-3">
          Signed in as {ROLE_LABELS[ctx.role as Role] ?? ctx.role}
        </p>
      </div>
      <AccountForm fullName={ctx.fullName} email={ctx.email} />
    </div>
  );
}
