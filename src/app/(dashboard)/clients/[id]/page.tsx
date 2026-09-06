import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "react-feather";
import { getSessionContext } from "@/lib/session";
import { getClient } from "@/lib/queries/clients";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";
import { ClientActions } from "@/components/clients/ClientActions";
import { PortalLinkCard } from "@/components/clients/PortalLinkCard";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) notFound();
  const { id } = await params;
  const c = await getClient(ctx.agencyId, id);
  if (!c) notFound();

  const f = c.finance;

  return (
    <div className="space-y-5">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink-2"
      >
        <ArrowLeft size={14} />
        Clients
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              {c.companyName}
            </h2>
            {!c.isActive && (
              <span className="rounded-md bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-ink-3">
                Inactive
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
            <span>{c.contactName}</span>
            <span className="inline-flex items-center gap-1">
              <Mail size={12} /> {c.email}
            </span>
            {c.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone size={12} /> {c.phone}
              </span>
            )}
            {(c.city || c.country) && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {[c.city, c.country].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
        <ClientActions client={c} />
      </div>

      <Card>
        <CardHeader title="Financial summary" menu={false} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-5 sm:grid-cols-4">
          <Figure label="Lifetime value" value={formatCurrency(f.lifetimeValue)} />
          <Figure label="Invoiced" value={formatCurrency(f.invoiced)} muted />
          <Figure label="Paid" value={formatCurrency(f.paid)} accent="profit" />
          <Figure
            label="Outstanding"
            value={formatCurrency(f.outstanding)}
            accent={f.outstanding > 0 ? "loss" : undefined}
          />
        </div>
      </Card>

      <PortalLinkCard clientId={c.id} token={c.portalToken} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Projects"
            subtitle={`${c.projects.length} total`}
            menu={false}
          />
          {c.projects.length === 0 ? (
            <Empty text="No projects for this client." />
          ) : (
            <div className="overflow-x-auto px-2 pb-3 pt-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Project", "Status", "Contract", "Profit"].map((h) => (
                      <th
                        key={h}
                        className="eyebrow px-3 pb-2 pt-1 text-left font-semibold"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.projects.map((p) => (
                    <tr key={p.id} className="border-t border-hairline">
                      <td className="px-3 py-2 text-[12.5px] font-medium text-ink">
                        <Link
                          href={`/projects/${p.id}`}
                          className="hover:text-accent-strong"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <ProjectStatusBadge status={p.status} />
                      </td>
                      <td className="tnum px-3 py-2 text-[12.5px] text-ink-2">
                        {formatCurrency(p.contractValue)}
                      </td>
                      <td className="tnum px-3 py-2 text-[12.5px] font-medium text-ink">
                        {formatCurrency(p.profit)}{" "}
                        <span className="text-ink-3">
                          {p.profitMargin.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Invoices"
            subtitle={`${c.invoices.length} total`}
            menu={false}
          />
          {c.invoices.length === 0 ? (
            <Empty text="No invoices for this client." />
          ) : (
            <div className="overflow-x-auto px-2 pb-3 pt-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Invoice", "Status", "Amount", "Balance"].map((h) => (
                      <th
                        key={h}
                        className="eyebrow px-3 pb-2 pt-1 text-left font-semibold"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {c.invoices.map((i) => (
                    <tr key={i.id} className="border-t border-hairline">
                      <td className="tnum px-3 py-2 text-[12.5px] font-medium text-ink">
                        <Link
                          href={`/invoices/${i.id}`}
                          className="hover:text-accent-strong"
                        >
                          {i.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={i.status} />
                      </td>
                      <td className="tnum px-3 py-2 text-[12.5px] text-ink-2">
                        {formatCurrency(i.amount)}
                      </td>
                      <td className="tnum px-3 py-2 text-[12.5px] text-ink-2">
                        {i.balance === 0 ? "—" : formatCurrency(i.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <p className="text-[12px] text-ink-3">
        Client since {formatDate(c.createdAt)}
      </p>
    </div>
  );
}

function Figure({
  label,
  value,
  muted,
  accent,
}: {
  label: string;
  value: string;
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
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-8 text-center text-[13px] text-ink-3">{text}</p>;
}
