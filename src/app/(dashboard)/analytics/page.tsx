import { Download } from "react-feather";
import { getSessionContext } from "@/lib/session";
import { getReport } from "@/lib/queries/report";
import { parsePeriodParams } from "@/lib/period-params";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { CashFlowChart } from "@/components/analytics/CashFlowChart";
import { ProfitabilityTable } from "@/components/analytics/ProfitabilityTable";
import { PeriodSelect } from "@/components/analytics/PeriodSelect";
import { DeltaStat } from "@/components/analytics/DeltaStat";
import { BarList } from "@/components/analytics/BarList";
import { AgingChart } from "@/components/analytics/AgingChart";
import { GstTable } from "@/components/analytics/GstTable";
import { DsoCard } from "@/components/analytics/DsoCard";
import { ClientConcentration } from "@/components/analytics/ClientConcentration";

export const dynamic = "force-dynamic";

const SECTIONS = [
  ["cashflow", "Cash flow"],
  ["profitability", "Profitability"],
  ["payments", "Payments"],
  ["gst", "GST"],
  ["aging", "Aging"],
  ["dso", "Collection speed"],
  ["expenses", "Expenses"],
  ["clients", "Clients"],
] as const;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
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
  const periodInput = parsePeriodParams(sp);
  const r = await getReport(ctx.agencyId, periodInput);
  const { period, summary } = r;
  const exportQs = new URLSearchParams(
    Object.entries(sp).filter(([k, v]) => v && ["period", "from", "to"].includes(k)) as [
      string,
      string,
    ][],
  ).toString();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            Analytics
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            {period.label} · compared with {period.prevLabel}
          </p>
        </div>
        <PeriodSelect
          preset={periodInput.preset}
          from={periodInput.from}
          to={periodInput.to}
        />
      </div>

      {/* anchor nav */}
      <div className="flex flex-wrap gap-1.5 border-y border-hairline py-2 text-[12.5px]">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-md px-2 py-0.5 font-medium text-ink-3 hover:bg-surface-sunken hover:text-ink-2"
          >
            {label}
          </a>
        ))}
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DeltaStat
          label="Money in"
          value={formatCurrency(summary.revenue.value)}
          metric={summary.revenue}
          prevLabel={period.prevLabel}
        />
        <DeltaStat
          label="Money out"
          value={formatCurrency(summary.cost.value)}
          metric={summary.cost}
          invertColour
          prevLabel={period.prevLabel}
        />
        <DeltaStat
          label="Net"
          value={formatCurrency(summary.net.value)}
          metric={summary.net}
          prevLabel={period.prevLabel}
        />
        <DeltaStat
          label="Net margin"
          value={`${summary.marginPct}%`}
          pointsDelta={summary.marginDeltaPts}
          prevLabel={period.prevLabel}
        />
      </div>

      <Section id="cashflow" title="Cash flow" subtitle="Payments received vs expenses + overhead, by date">
        <CashFlowChart data={r.cashflow} />
      </Section>

      <Section
        id="profitability"
        title="Project profitability"
        subtitle={`${r.profitability.length} projects, ranked by margin`}
        action={
          <a
            href={`/api/analytics/export${exportQs ? `?${exportQs}` : ""}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 text-[12.5px] font-medium text-ink hover:bg-surface-sunken"
          >
            <Download size={13} />
            CSV
          </a>
        }
      >
        <ProfitabilityTable rows={r.profitability} />
        <p className="border-t border-hairline px-5 py-3 text-[12px] text-ink-3">
          Overhead allocated by: {r.overhead.methodLabel}
          {r.overhead.method !== "manual" && r.overhead.method !== "percent"
            ? ` · pool ≈ ${formatCurrency(r.overhead.monthlyPool)}/mo`
            : ""}
          .
        </p>
      </Section>

      <Section id="payments" title="Payments by method" subtitle={period.label}>
        <BarList
          items={r.paymentMethods.map((m) => ({
            label: m.label,
            amount: m.amount,
            pct: m.pct,
            sub: `${m.count}×`,
          }))}
          empty="No payments received in this period."
        />
      </Section>

      <Section id="gst" title="GST collected" subtitle="By financial-year quarter (Apr–Mar)">
        <GstTable
          byQuarter={r.gst.byQuarter}
          summary={r.gst.summary}
          periodLabel={period.label}
        />
      </Section>

      <Section id="aging" title="Receivables aging" subtitle="How overdue unpaid invoices are, as of today">
        <AgingChart data={r.aging} />
      </Section>

      <Section id="dso" title="Collection speed" subtitle={`Invoices paid in ${period.label}`}>
        <DsoCard data={r.dso} />
      </Section>

      <Section id="expenses" title="Expenses by category" subtitle={period.label}>
        <div className="grid gap-0 sm:grid-cols-2 sm:divide-x sm:divide-hairline">
          <div>
            <p className="eyebrow px-5 pt-4">
              Project · {formatCurrency(r.expenses.projectTotal)}
            </p>
            <BarList
              items={r.expenses.project.map((s) => ({
                label: s.label,
                amount: s.amount,
                pct: s.pct,
                sub: `${s.count}×`,
              }))}
              empty="No project expenses."
            />
          </div>
          <div>
            <p className="eyebrow px-5 pt-4">
              Company · {formatCurrency(r.expenses.companyTotal)}
            </p>
            <BarList
              items={r.expenses.company.map((s) => ({
                label: s.label,
                amount: s.amount,
                pct: s.pct,
                sub: `${s.count}×`,
              }))}
              empty="No company expenses."
            />
          </div>
        </div>
      </Section>

      <Section id="clients" title="Client concentration" subtitle={`Revenue share in ${period.label}`}>
        <ClientConcentration data={r.clients} />
      </Section>
    </div>
  );
}

function Section({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <Card>
        <CardHeader title={title} subtitle={subtitle} action={action} menu={false} />
        {children}
      </Card>
    </section>
  );
}
