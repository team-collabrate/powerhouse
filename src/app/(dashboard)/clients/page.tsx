import { getSessionContext } from "@/lib/session";
import { listClients } from "@/lib/queries/clients";
import { ClientsFilters } from "@/components/clients/ClientsFilters";
import { ClientsTable } from "@/components/clients/ClientsTable";
import { NewClientButton } from "@/components/clients/NewClientButton";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inactive?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return (
      <div className="rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-10 text-center">
        <p className="text-[13px] font-medium text-ink">
          Connect a database to manage clients
        </p>
        <p className="mt-1 text-[13px] text-ink-3">
          Set your Supabase env vars and sign in.
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const { items, activeCount, inactiveCount } = await listClients(ctx.agencyId, {
    q: sp.q,
    includeInactive: sp.inactive === "1",
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
            Clients
          </h2>
          <p className="mt-1 text-[13px] text-ink-3">
            {activeCount} active
            {inactiveCount > 0 && ` · ${inactiveCount} inactive`}
          </p>
        </div>
        <NewClientButton />
      </div>

      <ClientsFilters inactiveCount={inactiveCount} />
      <ClientsTable items={items} />
    </div>
  );
}
