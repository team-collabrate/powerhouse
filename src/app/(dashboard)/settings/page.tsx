import { getSessionContext } from "@/lib/session";
import { can } from "@/lib/permissions";
import {
  getAgencySettings,
  listCompanyExpenses,
  listTeamMembers,
} from "@/lib/queries/settings";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { AgencySettingsForm } from "@/components/settings/AgencySettingsForm";
import { CompanyExpensesCard } from "@/components/settings/CompanyExpensesCard";

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

  const [settings, overhead, team] = await Promise.all([
    getAgencySettings(ctx.agencyId),
    listCompanyExpenses(ctx.agencyId),
    listTeamMembers(ctx.agencyId, ctx.userId),
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

      <Card>
        <CardHeader
          title="Team"
          subtitle={`${team.filter((m) => m.isActive).length} active`}
          menu={false}
          action={
            <span className="text-[12px] text-ink-3">Invites coming soon</span>
          }
        />
        <div className="overflow-x-auto px-2 pb-3 pt-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name", "Email", "Role"].map((h) => (
                  <th
                    key={h}
                    className="eyebrow px-3 pb-2 pt-1 text-left font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr key={m.id} className="border-t border-hairline">
                  <td className="px-3 py-2 text-[12.5px] font-medium text-ink">
                    {m.fullName}
                    {m.isYou && (
                      <span className="ml-2 text-[11px] text-ink-3">you</span>
                    )}
                    {!m.isActive && (
                      <span className="ml-2 rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-ink-3">
                        inactive
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[12.5px] text-ink-2">
                    {m.email}
                  </td>
                  <td className="px-3 py-2 text-[12.5px] text-ink-2">
                    {m.roleLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
