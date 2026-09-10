import Link from "next/link";
import { getSessionContext } from "@/lib/session";
import { getDashboardData } from "@/lib/queries/dashboard";
import { DEMO_DASHBOARD } from "@/lib/demo-data";
import type { DashboardView } from "@/lib/dashboard-types";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ProfitAreaChart } from "@/components/dashboard/ProfitAreaChart";
import { ServiceDonut } from "@/components/dashboard/ServiceDonut";
import { TopProjects } from "@/components/dashboard/TopProjects";
import { ClientGrowthBars } from "@/components/dashboard/ClientGrowthBars";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { InsightsCard } from "@/components/dashboard/InsightsCard";
import { FirstRun } from "@/components/dashboard/FirstRun";
import { NewProjectButton } from "@/components/projects/NewProjectButton";
import { NewInvoiceButton } from "@/components/invoices/NewInvoiceButton";
import { invoiceableProjects } from "@/lib/queries/invoices";

export const dynamic = "force-dynamic";

function ViewAll({ href }: { href?: string }) {
  if (!href) {
    return <span className="text-[12px] font-medium text-ink-3">View all</span>;
  }
  return (
    <Link
      href={href}
      className="text-[12px] font-medium text-accent-strong hover:underline"
    >
      View all
    </Link>
  );
}

export default async function DashboardPage() {
  const ctx = await getSessionContext();

  let view: DashboardView = DEMO_DASHBOARD;
  let projects: Awaited<ReturnType<typeof invoiceableProjects>> = [];
  if (ctx) {
    try {
      const name = ctx.fullName.trim().split(/\s+/)[0] || "there";
      [view, projects] = await Promise.all([
        getDashboardData(ctx.agencyId, name),
        invoiceableProjects(ctx.agencyId),
      ]);
    } catch (err) {
      console.error("dashboard query failed, falling back to demo data", err);
    }
  }

  if (view.isEmpty) {
    return <FirstRun name={view.greetingName} />;
  }

  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              Welcome back, {view.greetingName}
            </h2>
            {view.isDemo && (
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-ink-3">
                Sample data
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-3">
            Here&apos;s how the studio is tracking this year.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewProjectButton variant="secondary" />
          <NewInvoiceButton projects={projects} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {view.kpis.map(({ id, ...k }) => (
          <KpiCard key={id} {...k} />
        ))}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader title="Profit Performance" subtitle="Last 12 months" />
          <ProfitAreaChart series={view.profit} />
        </Card>
        <Card className="lg:col-span-4">
          <CardHeader title="Revenue by Service" subtitle="Share of contract value" />
          <ServiceDonut slices={view.services} />
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader
            title="Top Projects"
            subtitle="By profit margin"
            action={<ViewAll href="/projects" />}
            menu={false}
          />
          <TopProjects items={view.topProjects} />
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader title="Client Growth" subtitle="Last 6 months" />
          <ClientGrowthBars data={view.clientGrowth} />
        </Card>
        <Card className="lg:col-span-6">
          <CardHeader
            title="Recent Invoices"
            action={view.isDemo ? <ViewAll /> : <ViewAll href="/invoices" />}
            menu={false}
          />
          <RecentInvoices rows={view.recentInvoices} />
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Insights" subtitle="Needs attention" menu={false} />
          <InsightsCard items={view.insights} />
        </Card>
      </div>
    </div>
  );
}
