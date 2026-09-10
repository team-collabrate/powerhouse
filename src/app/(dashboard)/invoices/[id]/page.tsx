import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "react-feather";
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
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink-2"
        >
          <ArrowLeft size={14} />
          Invoices
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={`/print/invoice/${id}`}
            target="_blank"
            rel="noopener"
            className="text-[12.5px] font-medium text-ink-3 hover:text-ink-2"
          >
            Print view
          </a>
          <a
            href={`/api/invoices/${id}/pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink-2"
          >
            <FileText size={14} />
            PDF
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="tnum text-[22px] font-semibold tracking-[-0.02em] text-ink">
              {invoice.invoiceNumber}
            </h2>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-[13px] text-ink-3">
            <Link
              href={`/clients/${invoice.clientId}`}
              className="hover:text-ink-2"
            >
              {invoice.clientName}
            </Link>{" "}
            ·{" "}
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
        <CardHeader title="Line items" menu={false} />
        <div className="overflow-x-auto px-2 pb-2 pt-1">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr>
                {["Description", "Qty", "Rate", "Amount"].map((h, i) => (
                  <th
                    key={h}
                    className={`eyebrow px-3 pb-2 pt-1 font-semibold ${i === 0 ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((li) => (
                <tr key={li.id} className="border-t border-hairline">
                  <td className="px-3 py-2 text-ink">{li.description}</td>
                  <td className="tnum px-3 py-2 text-right text-ink-2">
                    {li.quantity}
                  </td>
                  <td className="tnum px-3 py-2 text-right text-ink-2">
                    {formatCurrency(li.unitPrice)}
                  </td>
                  <td className="tnum px-3 py-2 text-right font-medium text-ink">
                    {formatCurrency(li.quantity * li.unitPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-hairline">
                <td colSpan={3} className="px-3 py-1.5 text-right text-ink-3">
                  Subtotal
                </td>
                <td className="tnum px-3 py-1.5 text-right text-ink-2">
                  {formatCurrency(invoice.subtotal)}
                </td>
              </tr>
              {invoice.taxRatePct > 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-1.5 text-right text-ink-3">
                    Tax ({invoice.taxRatePct}%)
                  </td>
                  <td className="tnum px-3 py-1.5 text-right text-ink-2">
                    {formatCurrency(invoice.tax)}
                  </td>
                </tr>
              )}
              <tr className="border-t border-hairline">
                <td colSpan={3} className="px-3 py-2 text-right font-semibold text-ink">
                  Total
                </td>
                <td className="tnum px-3 py-2 text-right font-semibold text-ink">
                  {formatCurrency(invoice.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

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
        {(invoice.issueDate ||
          invoice.sentDate ||
          invoice.viewedDate ||
          invoice.notes) && (
          <div className="space-y-1 border-t border-hairline px-5 py-3 text-[12.5px] text-ink-3">
            {invoice.issueDate && (
              <p>Issued {formatDate(invoice.issueDate)}</p>
            )}
            {invoice.sentDate && <p>Sent {formatDate(invoice.sentDate)}</p>}
            {invoice.viewedDate && (
              <p>Viewed by client {formatDate(invoice.viewedDate)}</p>
            )}
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
