import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "react-feather";
import { getSessionContext } from "@/lib/session";
import { getInvoice, invoiceableProjects } from "@/lib/queries/invoices";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { InvoiceActions } from "@/components/invoices/InvoiceActions";
import { InvoicePaymentsCard } from "@/components/invoices/InvoicePaymentsCard";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) notFound();
  const { id } = await params;
  const [invoice, projects] = await Promise.all([
    getInvoice(ctx.agencyId, id),
    invoiceableProjects(ctx.agencyId),
  ]);
  if (!invoice) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink-2"
      >
        <ArrowLeft size={14} />
        Invoices
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="tnum text-[22px] font-semibold tracking-[-0.02em] text-ink">
              {invoice.invoiceNumber}
            </h2>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-[13px] text-ink-3">
            {invoice.clientName} ·{" "}
            <Link
              href={`/projects/${invoice.projectId}`}
              className="hover:text-ink-2"
            >
              {invoice.projectName}
            </Link>
          </p>
        </div>
        <InvoiceActions invoice={invoice} projects={projects} />
      </div>

      <Card>
        <CardHeader title="Summary" menu={false} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-4">
          <Figure label="Amount" value={formatCurrency(invoice.amount)} />
          <Figure
            label="Paid"
            value={formatCurrency(invoice.amountPaid)}
            accent={invoice.amountPaid > 0 ? "profit" : undefined}
          />
          <Figure
            label="Balance"
            value={formatCurrency(invoice.balance)}
            accent={
              invoice.balance > 0 && invoice.status === "overdue"
                ? "loss"
                : undefined
            }
          />
          <Figure
            label={invoice.status === "paid" ? "Paid on" : "Due"}
            value={formatDate(
              invoice.status === "paid" && invoice.paidDate
                ? invoice.paidDate
                : invoice.dueDate,
            )}
          />
        </div>
        {(invoice.issueDate || invoice.sentDate || invoice.notes) && (
          <div className="space-y-1 border-t border-hairline px-5 py-3 text-[12.5px] text-ink-3">
            {invoice.issueDate && (
              <p>Issued {formatDate(invoice.issueDate)}</p>
            )}
            {invoice.sentDate && <p>Sent {formatDate(invoice.sentDate)}</p>}
            {invoice.notes && (
              <p className="pt-1 text-[13px] text-ink-2">{invoice.notes}</p>
            )}
          </div>
        )}
      </Card>

      <div className="max-w-2xl">
        <InvoicePaymentsCard invoice={invoice} />
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
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
              : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
