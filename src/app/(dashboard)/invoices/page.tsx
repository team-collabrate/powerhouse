import { getSessionContext } from "@/lib/session";
import {
  listInvoices,
  invoiceableProjects,
  type InvoiceStatus,
} from "@/lib/queries/invoices";
import { formatCurrency } from "@/lib/format";
import { InvoicesFilters } from "@/components/invoices/InvoicesFilters";
import { InvoicesTable } from "@/components/invoices/InvoicesTable";
import { NewInvoiceButton } from "@/components/invoices/NewInvoiceButton";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">
          Connect a database to manage invoices
        </p>
        <p className="mt-1 text-[13px] text-ink-3">
          Set your Supabase env vars and sign in.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const [{ items, counts, outstandingTotal, overdueTotal }, projects] =
    await Promise.all([
      listInvoices(ctx.agencyId, {
        status: (sp.status as InvoiceStatus) ?? undefined,
        q: sp.q,
      }),
      invoiceableProjects(ctx.agencyId),
    ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            Invoices
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            <span className="tnum">{formatCurrency(outstandingTotal)}</span>{" "}
            outstanding
            {overdueTotal > 0 && (
              <>
                {" · "}
                <span className="tnum text-loss">
                  {formatCurrency(overdueTotal)}
                </span>{" "}
                overdue
              </>
            )}
          </p>
        </div>
        <NewInvoiceButton projects={projects} />
      </div>

      <InvoicesFilters counts={counts} />
      <InvoicesTable items={items} />
    </div>
  );
}
