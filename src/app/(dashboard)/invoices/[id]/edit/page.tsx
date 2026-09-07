import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { getInvoicePrintData } from "@/lib/queries/invoices";
import { can } from "@/lib/permissions";
import { InvoiceEditor } from "@/components/invoices/InvoiceEditor";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) notFound();
  if (!can(ctx.role, "invoice:write")) redirect(`/invoices/${(await params).id}`);

  const { id } = await params;
  const data = await getInvoicePrintData(ctx.agencyId, id);
  if (!data) notFound();
  if (data.status !== "draft") redirect(`/invoices/${id}`);

  const addressLines = [
    data.client.address,
    [data.client.city, data.client.state].filter(Boolean).join(", "),
    [data.client.country, data.client.zipCode].filter(Boolean).join(" "),
  ].filter((l): l is string => !!l && l.trim().length > 0);

  return (
    <InvoiceEditor
      invoiceId={id}
      invoiceNumber={data.invoiceNumber}
      agency={data.agency}
      client={{
        companyName: data.client.companyName,
        contactName: data.client.contactName,
        email: data.client.email,
        addressLines,
      }}
      initial={{
        issueDate: data.issueDate ? data.issueDate.slice(0, 10) : "",
        dueDate: data.dueDate.slice(0, 10),
        notes: data.notes ?? "",
        taxRatePct: data.taxRatePct,
        lineItems: data.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        })),
      }}
    />
  );
}
