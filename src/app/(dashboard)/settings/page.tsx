import { getSessionContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import {
  getAgencySettings,
  listCompanyExpenses,
  listTeamMembers,
  listInvites,
} from "@/lib/queries/settings";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { AgencySettingsForm } from "@/components/settings/AgencySettingsForm";
import { CompanyExpensesCard } from "@/components/settings/CompanyExpensesCard";
import { OverheadAllocationCard } from "@/components/settings/OverheadAllocationCard";
import { TeamCard } from "@/components/settings/TeamCard";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await getSessionContext();

  if (!ctx) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">
          Connect a database to manage settings
        </p>
      </div>
    );
  }

  if (!can(ctx.role, "settings:manage")) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">Admins only</p>
        <p className="mt-1 text-[13px] text-ink-3">
          Ask an agency admin to change these settings.
        </p>
      </div>
    );
  }

  const [settings, overhead, team, invites] = await Promise.all([
    getAgencySettings(ctx.agencyId),
    listCompanyExpenses(ctx.agencyId),
    listTeamMembers(ctx.agencyId, ctx.userId),
    listInvites(ctx.agencyId),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
          Settings
        </h2>
        <p className="mt-1 text-[13px] text-ink-3">Agency configuration</p>
      </div>

      {settings && (
        <Card>
          <CardHeader title="Agency" menu={false} />
          <AgencySettingsForm settings={settings} />
        </Card>
      )}

      <CompanyExpensesCard data={overhead} />

      {settings && (
        <OverheadAllocationCard
          method={settings.overheadMethod}
          ratePct={settings.overheadRatePct}
          monthlyPool={overhead.monthlyPool}
        />
      )}

      <TeamCard members={team} invites={invites} />
    </div>
  );
}
