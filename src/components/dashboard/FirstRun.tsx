import Link from "next/link";
import { Briefcase, FileText, Users } from "react-feather";

const steps = [
  {
    icon: Users,
    title: "Add a client",
    body: "Every project and invoice belongs to a client.",
    href: "/clients",
    cta: "Go to clients",
  },
  {
    icon: Briefcase,
    title: "Create a project",
    body: "Set the contract value and estimated team cost — that's the profit baseline.",
    href: "/projects",
    cta: "Go to projects",
  },
  {
    icon: FileText,
    title: "Raise an invoice",
    body: "Bill against a project, send it, and record payments as they land.",
    href: "/invoices",
    cta: "Go to invoices",
  },
];

export function FirstRun({ name }: { name: string }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
          Welcome to Powerhouse, {name}
        </h2>
        <p className="mt-1 text-[13px] text-ink-3">
          Three steps and your dashboard starts tracking real numbers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, body, href, cta }, i) => (
          <div
            key={href}
            className="flex flex-col rounded-[var(--radius-md)] border border-hairline bg-surface-raised p-5"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] bg-accent-soft text-accent-strong">
                <Icon size={16} />
              </span>
              <span className="text-[11px] font-semibold text-ink-3">
                Step {i + 1}
              </span>
            </div>
            <h3 className="mt-3 text-[14px] font-semibold text-ink">{title}</h3>
            <p className="mt-1 flex-1 text-[12.5px] leading-relaxed text-ink-3">
              {body}
            </p>
            <Link
              href={href}
              className="mt-3 inline-flex text-[12.5px] font-medium text-accent-strong hover:underline"
            >
              {cta} →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
