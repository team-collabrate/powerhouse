import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getInvoicePrintData } from "@/lib/queries/invoices";
import { InvoiceDocument } from "@/components/invoices/InvoiceDocument";
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

  const addressLines = [
    data.client.address,
    [data.client.city, data.client.state].filter(Boolean).join(", "),
    [data.client.country, data.client.zipCode].filter(Boolean).join(" "),
  ].filter((l): l is string => !!l && l.trim().length > 0);

  return (
    <div className="min-h-screen bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto flex max-w-[760px] items-center justify-between px-6 pb-4 print:hidden">
        <Link
          href={`/invoices/${id}`}
          className="text-[13px] text-neutral-500 hover:text-neutral-800"
        >
          ← Back to invoice
        </Link>
        <PrintButton auto />
      </div>

      <InvoiceDocument
        agency={data.agency}
        client={{
          companyName: data.client.companyName,
          contactName: data.client.contactName,
          email: data.client.email,
          addressLines,
        }}
        invoiceNumber={data.invoiceNumber}
        status={data.status}
        issueDate={data.issueDate}
        dueDate={data.dueDate}
        lineItems={data.lineItems}
        taxRatePct={data.taxRatePct}
        amountPaid={data.amountPaid}
        notes={data.notes}
      />
    </div>
  );
}
