import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getInvoicePrintData } from "@/lib/queries/invoices";
import { formatCurrency, formatDate } from "@/lib/format";
import { PrintButton } from "@/components/invoices/PrintButton";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) notFound();
  const { id } = await params;
  const data = await getInvoicePrintData(ctx.agencyId, id);
  if (!data) notFound();

  const accent = /^#[0-9a-fA-F]{6}$/.test(data.agency.brandColor)
    ? data.agency.brandColor
    : "#9933ff";

  const addr = [
    data.client.address,
    [data.client.city, data.client.state].filter(Boolean).join(", "),
    [data.client.country, data.client.zipCode].filter(Boolean).join(" "),
  ].filter((l) => l && l.trim());

  return (
    <div className="min-h-screen bg-neutral-100 py-8 text-neutral-900 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-[760px] items-center justify-between px-6 pb-4 print:hidden">
        <Link href={`/invoices/${id}`} className="text-[13px] text-neutral-500 hover:text-neutral-800">
          ← Back to invoice
        </Link>
        <PrintButton auto />
      </div>

      <article className="mx-auto max-w-[760px] bg-white p-10 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-2 pb-6" style={{ borderColor: accent }}>
          <div>
            {data.agency.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.agency.logoUrl} alt={data.agency.name} className="mb-2 h-9 w-auto" />
            ) : (
              <div
                className="mb-2 grid h-9 w-9 place-items-center rounded text-[15px] font-bold text-white"
                style={{ background: accent }}
              >
                {data.agency.name.charAt(0)}
              </div>
            )}
            <p className="text-[15px] font-semibold">{data.agency.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-bold tracking-tight">Invoice</p>
            <p className="mt-0.5 font-mono text-[13px] text-neutral-500">
              {data.invoiceNumber}
            </p>
            <p className="mt-2 inline-block rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
              {data.status}
            </p>
          </div>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-8 text-[13px]">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Billed to
            </p>
            <p className="font-medium">{data.client.companyName}</p>
            <p className="text-neutral-600">{data.client.contactName}</p>
            <p className="text-neutral-600">{data.client.email}</p>
            {addr.map((l, i) => (
              <p key={i} className="text-neutral-600">
                {l}
              </p>
            ))}
          </div>
          <div className="text-right">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              Details
            </p>
            {data.issueDate && (
              <p className="text-neutral-600">
                Issued <span className="text-neutral-900">{formatDate(data.issueDate)}</span>
              </p>
            )}
            <p className="text-neutral-600">
              Due <span className="text-neutral-900">{formatDate(data.dueDate)}</span>
            </p>
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-400">
              <th className="pb-2 font-semibold">Description</th>
              <th className="pb-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-100">
              <td className="py-3">{data.projectName}</td>
              <td className="py-3 text-right tabular-nums">
                {formatCurrency(data.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-64 text-[13px]">
          <div className="flex justify-between py-1 text-neutral-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(data.amount)}</span>
          </div>
          {data.amountPaid > 0 && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Paid</span>
              <span className="tabular-nums">−{formatCurrency(data.amountPaid)}</span>
            </div>
          )}
          <div
            className="mt-1 flex justify-between border-t-2 py-2 text-[15px] font-bold"
            style={{ borderColor: accent }}
          >
            <span>{data.amountPaid > 0 ? "Balance due" : "Total"}</span>
            <span className="tabular-nums">{formatCurrency(data.balance)}</span>
          </div>
        </div>

        {data.notes && (
          <div className="mt-8 border-t border-neutral-200 pt-4 text-[12.5px] text-neutral-600">
            <p className="mb-1 font-semibold text-neutral-500">Notes</p>
            <p className="whitespace-pre-wrap">{data.notes}</p>
          </div>
        )}

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-center text-[11px] text-neutral-400">
          {data.agency.name} · {data.invoiceNumber}
        </footer>
      </article>
    </div>
  );
}
