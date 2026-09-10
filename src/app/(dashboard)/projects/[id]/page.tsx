import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "react-feather";
import { getSessionContext } from "@/lib/session";
import { getProject } from "@/lib/queries/projects";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { EditProjectButton } from "@/components/projects/EditProjectButton";
import { CloseProjectButton } from "@/components/projects/CloseProjectButton";
import { ProjectExpensesCard } from "@/components/expenses/ProjectExpensesCard";
import { MilestonesCard } from "@/components/projects/MilestonesCard";
import { displayInvoiceStatus } from "@/lib/invoice-status";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) notFound();
  const { id } = await params;
  const p = await getProject(ctx.agencyId, id);
  if (!p) notFound();

  const c = p.cost;

  return (
    <div className="space-y-5">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink-2"
      >
        <ArrowLeft size={14} />
        Projects
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              {p.name}
            </h2>
            <ProjectStatusBadge status={p.status} />
          </div>
          <p className="mt-1 text-[13px] text-ink-3">
            <Link
              href={`/clients/${p.clientId}`}
              className="hover:text-ink-2"
            >
              {p.clientName}
            </Link>{" "}
            · {p.serviceLabel}
            {p.deadline && ` · Due ${formatDate(p.deadline)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CloseProjectButton id={p.id} name={p.name} status={p.status} />
          <EditProjectButton project={p} />
        </div>
      </div>

      {p.description && (
        <p className="max-w-2xl text-[13.5px] leading-relaxed text-ink-2">
          {p.description}
        </p>
      )}

      {/* Profit breakdown */}
      <Card>
        <CardHeader title="Profitability" menu={false} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-3 lg:grid-cols-6">
          <Figure label="Contract" value={formatCurrency(p.contractValue)} />
          <Figure label="Team cost" value={formatCurrency(c.teamCost)} muted />
          <Figure label="Expenses" value={formatCurrency(c.expenses)} muted />
          <Figure
            label="Overhead"
            value={formatCurrency(c.overhead)}
            muted
            sub={
              c.overheadSource === "pinned"
                ? "pinned"
                : c.overheadSource === "rule"
                  ? "agency rule"
                  : undefined
            }
          />
          <Figure label="Total cost" value={formatCurrency(c.total)} muted />
          <Figure
            label="Profit"
            value={formatCurrency(c.profit)}
            accent={c.profit >= 0 ? "profit" : "loss"}
            sub={`${c.profitMargin.toFixed(1)}% margin`}
          />
        </div>
        <div className="border-t border-hairline px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-ink-3">Progress</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${p.progressPercentage}%` }}
              />
            </div>
            <span className="tnum text-[12px] font-medium text-ink">
              {p.progressPercentage}%
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProjectExpensesCard
          projectId={p.id}
          projectName={p.name}
          clientName={p.clientName}
          expenses={p.expenses}
        />

        <MilestonesCard projectId={p.id} milestones={p.milestones} />

        {/* Invoices */}
        <Card>
          <CardHeader title="Invoices" menu={false} />
          {p.invoices.length === 0 ? (
            <Empty text="No invoices for this project." />
          ) : (
            <table className="w-full border-collapse px-2">
              <tbody>
                {p.invoices.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="tnum px-5 py-2.5 text-[13px] font-medium text-ink">
                      <Link
                        href={`/invoices/${i.id}`}
                        className="hover:text-accent-strong"
                      >
                        {i.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-2 py-2.5">
                      <StatusBadge
                        status={displayInvoiceStatus(
                          i.rawStatus,
                          new Date(i.dueDate),
                          i.amount,
                          i.amountPaid,
                        )}
                      />
                    </td>
                    <td className="tnum px-5 py-2.5 text-right text-[13px] text-ink">
                      {formatCurrency(i.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  sub,
  muted,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  muted?: boolean;
  accent?: "profit" | "loss";
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p
        className={`tnum mt-1 text-[17px] font-semibold ${
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
      {sub && <p className="mt-0.5 text-[11px] text-ink-3">{sub}</p>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-8 text-center text-[13px] text-ink-3">{text}</p>;
}
