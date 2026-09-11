import { notFound } from "next/navigation";
import { getPortalData } from "@/lib/portal";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export const dynamic = "force-dynamic";

const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: "In progress",
  in_review: "In review",
  delivered: "Delivered",
  closed: "Closed",
};

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getPortalData(token);
  if (!data) notFound();

  const { agency, client, projects, invoices, totals } = data;
  const accent = /^#[0-9a-fA-F]{6}$/.test(agency.brandColor)
    ? agency.brandColor
    : "#9933ff";

  return (
    <div
      className="min-h-screen bg-surface-sunken"
      style={{ ["--portal-accent" as string]: accent }}
    >
      <div className="h-1.5 w-full" style={{ background: accent }} />
      <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6">
        <header className="flex items-center gap-3">
          {agency.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agency.logoUrl}
              alt=""
              className="h-9 w-9 rounded-[var(--radius-xs)] object-contain"
            />
          ) : (
            <span
              className="grid h-9 w-9 place-items-center rounded-[var(--radius-xs)] text-[15px] font-bold text-white"
              style={{ background: accent }}
            >
              {agency.name.charAt(0)}
            </span>
          )}
          <div>
            <p className="text-[15px] font-semibold text-ink">{agency.name}</p>
            <p className="text-[12px] text-ink-3">
              Client portal · {client.companyName}
            </p>
          </div>
        </header>

        {/* money summary */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            ["Invoiced", totals.invoiced, false],
            ["Paid", totals.paid, false],
            ["Outstanding", totals.outstanding, true],
          ].map(([label, value, hl]) => (
            <div
              key={label as string}
              className="rounded-[var(--radius-md)] border border-hairline bg-surface p-4"
            >
              <p className="eyebrow">{label as string}</p>
              <p
                className="tnum mt-1.5 text-[19px] font-semibold tracking-[-0.02em]"
                style={{ color: hl && (value as number) > 0 ? "#d13438" : undefined }}
              >
                {formatCurrency(value as number)}
              </p>
            </div>
          ))}
        </div>

        {/* invoices */}
        <section className="mt-6 rounded-[var(--radius-md)] border border-hairline bg-surface">
          <h2 className="border-b border-hairline px-5 py-4 text-[15px] font-semibold text-ink">
            Invoices
          </h2>
          {invoices.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-3">
              No invoices yet.
            </p>
          ) : (
            <div className="overflow-x-auto px-2 py-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Invoice", "Issued", "Due", "Amount", "Balance", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="eyebrow px-3 pb-2 pt-1 text-left font-semibold"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.invoiceNumber} className="border-t border-hairline">
                      <td className="tnum px-3 py-2.5 text-[13px] font-medium text-ink">
                        {i.invoiceNumber}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-ink-3">
                        {i.issueDate ? formatDate(i.issueDate) : "-"}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[12.5px] text-ink-3">
                        {formatDate(i.dueDate)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[13px] text-ink-2">
                        {formatCurrency(i.amount)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-[13px] text-ink">
                        {i.balance === 0 ? "-" : formatCurrency(i.balance)}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={i.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* projects */}
        <section className="mt-5 rounded-[var(--radius-md)] border border-hairline bg-surface">
          <h2 className="border-b border-hairline px-5 py-4 text-[15px] font-semibold text-ink">
            Projects
          </h2>
          {projects.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-3">
              No projects yet.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {projects.map((p) => (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14px] font-medium text-ink">
                      {p.name}
                    </span>
                    <span className="text-[12px] text-ink-3">
                      {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                      {p.deadline && ` · due ${formatDate(p.deadline)}`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.progressPercentage}%`,
                          background: accent,
                        }}
                      />
                    </div>
                    <span className="tnum text-[12px] text-ink-3">
                      {p.progressPercentage}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-6 text-center text-[11px] text-ink-3">
          Questions? Reply to the email this link came from.
        </p>
      </div>
    </div>
  );
}
