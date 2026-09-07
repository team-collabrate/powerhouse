import { Download } from "react-feather";
import { getSessionContext } from "@/lib/session";
import {
  getAnalytics,
  ANALYTICS_PERIODS,
  type AnalyticsPeriod,
} from "@/lib/queries/analytics";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { CashFlowChart } from "@/components/analytics/CashFlowChart";
import { ProfitabilityTable } from "@/components/analytics/ProfitabilityTable";
import { AnalyticsPeriodSelect } from "@/components/analytics/AnalyticsPeriodSelect";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">
          Connect a database to see analytics
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const parsed = Number(sp.months);
  const months: AnalyticsPeriod = (ANALYTICS_PERIODS as readonly number[]).includes(
    parsed,
  )
    ? (parsed as AnalyticsPeriod)
    : 6;

  const a = await getAnalytics(ctx.agencyId, months);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            Analytics
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            Cash flow and project profitability
          </p>
        </div>
        <AnalyticsPeriodSelect current={months} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={`Money in · ${months}m`} value={formatCurrency(a.summary.revenue)} />
        <Stat label={`Money out · ${months}m`} value={formatCurrency(a.summary.cost)} muted />
        <Stat
          label="Net"
          value={formatCurrency(a.summary.net)}
          accent={a.summary.net >= 0 ? "profit" : "loss"}
        />
        <Stat
          label="Avg margin (active)"
          value={`${a.summary.avgMargin.toFixed(1)}%`}
        />
      </div>

      <Card>
        <CardHeader
          title="Cash flow"
          subtitle="Payments received vs expenses + overhead, by month"
          menu={false}
        />
        <CashFlowChart data={a.monthly} />
      </Card>

      {a.serviceMix.length > 0 && (
        <Card>
          <CardHeader title="Contract value by service" menu={false} />
          <ul className="space-y-2.5 px-5 pb-5 pt-4">
            {a.serviceMix.map((s) => (
              <li key={s.label}>
                <div className="flex items-baseline justify-between text-[13px]">
                  <span className="text-ink-2">{s.label}</span>
                  <span className="tnum text-ink">
                    {formatCurrency(s.amount)}{" "}
                    <span className="text-ink-3">{s.value}%</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${s.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Project profitability"
          subtitle={`${a.projects.length} projects, ranked by margin`}
          menu={false}
          action={
            <a
              href="/api/analytics/export"
              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 text-[12.5px] font-medium text-ink hover:bg-surface-sunken"
            >
              <Download size={13} />
              CSV
            </a>
          }
        />
        <ProfitabilityTable rows={a.projects} />
        <p className="border-t border-hairline px-5 py-3 text-[12px] text-ink-3">
          Overhead allocated by: {a.overhead.methodLabel}
          {a.overhead.method !== "manual" && a.overhead.method !== "percent"
            ? ` · pool ≈ ${formatCurrency(a.overhead.monthlyPool)}/mo`
            : ""}
          .
        </p>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: "profit" | "loss";
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-4">
      <p className="eyebrow">{label}</p>
      <p
        className={`tnum mt-1.5 text-[20px] font-semibold tracking-[-0.02em] ${
          accent === "profit"
            ? "text-profit"
            : accent === "loss"
              ? "text-loss"
              : muted
                ? "text-ink-2"
                : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
