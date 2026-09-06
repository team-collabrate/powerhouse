import { MetricCard } from "@/components/cards/MetricCard";
import { Button } from "@/components/ui/Button";
import { Plus, FileText } from "react-feather";

// Sprint 1: static shell. Sprint 3 wires these to /api/analytics/dashboard.
const METRICS: { label: string; value: string; change?: { value: string; positive: boolean } }[] = [
  { label: "Revenue this month", value: "$0", change: { value: "No data yet", positive: true } },
  { label: "Active projects", value: "0" },
  { label: "Cash received", value: "$0" },
  { label: "Avg. profit margin", value: "0%" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-text-primary">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Real-time profitability across every project.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Plus size={16} />
            New Project
          </Button>
          <Button variant="primary">
            <FileText size={16} />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="rounded-[var(--radius-md)] border border-border bg-bg-card p-10 text-center">
        <p className="text-sm font-medium text-text-primary">No projects yet</p>
        <p className="mt-1 text-sm text-text-muted">
          Create your first project to start tracking profit.
        </p>
      </div>
    </div>
  );
}
