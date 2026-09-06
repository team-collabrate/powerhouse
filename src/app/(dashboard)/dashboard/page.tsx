import { Plus } from "react-feather";
import { KPIS } from "@/lib/demo-data";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ProfitAreaChart } from "@/components/dashboard/ProfitAreaChart";
import { ServiceDonut } from "@/components/dashboard/ServiceDonut";
import { TopProjects } from "@/components/dashboard/TopProjects";
import { ClientGrowthBars } from "@/components/dashboard/ClientGrowthBars";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { InsightsCard } from "@/components/dashboard/InsightsCard";

function ViewAll() {
  return (
    <button className="text-[12px] font-medium text-accent-strong hover:underline">
      View all
    </button>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            Welcome back, Bella
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            Here&apos;s how the studio is tracking this month.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken">
            <Plus size={15} />
            New Project
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong">
            Create Invoice
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map(({ id, ...k }) => (
          <KpiCard key={id} {...k} />
        ))}
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader title="Profit Performance" subtitle="Last 30 days" />
          <ProfitAreaChart />
        </Card>
        <Card className="lg:col-span-4">
          <CardHeader title="Revenue by Service" subtitle="This quarter" />
          <ServiceDonut />
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader
            title="Top Projects"
            subtitle="By profit margin"
            action={<ViewAll />}
            menu={false}
          />
          <TopProjects />
        </Card>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-3">
          <CardHeader title="Client Growth" subtitle="Apr – Sep" />
          <ClientGrowthBars />
        </Card>
        <Card className="lg:col-span-6">
          <CardHeader
            title="Recent Invoices"
            action={<ViewAll />}
            menu={false}
          />
          <RecentInvoices />
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title="Insights" subtitle="Needs attention" menu={false} />
          <InsightsCard />
        </Card>
      </div>
    </div>
  );
}
