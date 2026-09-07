import { formatCurrency, formatDate } from "@/lib/format";
import { invoiceTotals, lineAmount } from "@/lib/invoice-total";

export interface InvoiceDocLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceDocProps {
  agency: { name: string; logoUrl: string | null; brandColor: string };
  client: {
    companyName: string;
    contactName: string;
    email: string;
    addressLines: string[];
  };
  invoiceNumber: string;
  status?: string;
  issueDate: string | null;
  dueDate: string;
  lineItems: InvoiceDocLine[];
  taxRatePct: number;
  amountPaid?: number;
  notes: string | null;
}

/**
 * The printable invoice — shared by /print/invoice/[id] and the live preview
 * in the editor. Pure presentational; safe in both server and client trees.
 */
export function InvoiceDocument(p: InvoiceDocProps) {
  const accent = /^#[0-9a-fA-F]{6}$/.test(p.agency.brandColor)
    ? p.agency.brandColor
    : "#9933ff";
  const { subtotal, tax, total } = invoiceTotals(p.lineItems, p.taxRatePct);
  const paid = p.amountPaid ?? 0;
  const balance = Math.max(0, total - paid);

  return (
    <article className="mx-auto max-w-[760px] bg-white p-10 text-neutral-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <header
        className="flex items-start justify-between border-b-2 pb-6"
        style={{ borderColor: accent }}
      >
        <div>
          {p.agency.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.agency.logoUrl}
              alt={p.agency.name}
              className="mb-2 h-9 w-auto"
            />
          ) : (
            <div
              className="mb-2 grid h-9 w-9 place-items-center rounded text-[15px] font-bold text-white"
              style={{ background: accent }}
            >
              {p.agency.name.charAt(0)}
            </div>
          )}
          <p className="text-[15px] font-semibold">{p.agency.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold tracking-tight">Invoice</p>
          <p className="mt-0.5 font-mono text-[13px] text-neutral-500">
            {p.invoiceNumber}
          </p>
          {p.status && (
            <p className="mt-2 inline-block rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-600">
              {p.status}
            </p>
          )}
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-8 text-[13px]">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Billed to
          </p>
          <p className="font-medium">{p.client.companyName}</p>
          <p className="text-neutral-600">{p.client.contactName}</p>
          <p className="text-neutral-600">{p.client.email}</p>
          {p.client.addressLines.map((l, i) => (
            <p key={i} className="text-neutral-600">
              {l}
            </p>
          ))}
        </div>
        <div className="text-right">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
            Details
          </p>
          {p.issueDate && (
            <p className="text-neutral-600">
              Issued{" "}
              <span className="text-neutral-900">{formatDate(p.issueDate)}</span>
            </p>
          )}
          <p className="text-neutral-600">
            Due <span className="text-neutral-900">{formatDate(p.dueDate)}</span>
          </p>
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-400">
            <th className="pb-2 font-semibold">Description</th>
            <th className="pb-2 text-right font-semibold">Qty</th>
            <th className="pb-2 text-right font-semibold">Rate</th>
            <th className="pb-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {p.lineItems.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-3 text-neutral-400">
                No line items yet
              </td>
            </tr>
          ) : (
            p.lineItems.map((li, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="py-3 pr-4">{li.description || "—"}</td>
                <td className="py-3 text-right tabular-nums">
                  {li.quantity % 1 === 0 ? li.quantity : li.quantity.toFixed(2)}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {formatCurrency(li.unitPrice)}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {formatCurrency(lineAmount(li))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-64 text-[13px]">
        <div className="flex justify-between py-1 text-neutral-600">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        {p.taxRatePct > 0 && (
          <div className="flex justify-between py-1 text-neutral-600">
            <span>Tax ({p.taxRatePct}%)</span>
            <span className="tabular-nums">{formatCurrency(tax)}</span>
          </div>
        )}
        {paid > 0 && (
          <div className="flex justify-between py-1 text-neutral-600">
            <span>Paid</span>
            <span className="tabular-nums">−{formatCurrency(paid)}</span>
          </div>
        )}
        <div
          className="mt-1 flex justify-between border-t-2 py-2 text-[15px] font-bold"
          style={{ borderColor: accent }}
        >
          <span>{paid > 0 ? "Balance due" : "Total"}</span>
          <span className="tabular-nums">{formatCurrency(paid > 0 ? balance : total)}</span>
        </div>
      </div>

      {p.notes && (
        <div className="mt-8 border-t border-neutral-200 pt-4 text-[12.5px] text-neutral-600">
          <p className="mb-1 font-semibold text-neutral-500">Notes</p>
          <p className="whitespace-pre-wrap">{p.notes}</p>
        </div>
      )}

      <footer className="mt-10 border-t border-neutral-200 pt-4 text-center text-[11px] text-neutral-400">
        {p.agency.name} · {p.invoiceNumber}
      </footer>
    </article>
  );
}
