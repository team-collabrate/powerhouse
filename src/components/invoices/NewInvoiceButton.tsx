"use client";

import { FileText } from "react-feather";
import { InvoiceDialog } from "./InvoiceDialog";
import { useCan } from "@/components/providers/SessionProvider";
import type { InvoiceProjectOption } from "@/lib/queries/invoices";

export function NewInvoiceButton({
  projects,
  variant = "primary",
}: {
  projects: InvoiceProjectOption[];
  variant?: "primary" | "secondary";
}) {
  if (!useCan("invoice:write")) return null;
  const disabled = projects.length === 0;
  return (
    <InvoiceDialog
      projects={projects}
      trigger={(open) => (
        <button
          onClick={open}
          disabled={disabled}
          title={disabled ? "Create a project first" : undefined}
          className={
            variant === "primary"
              ? "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-accent px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
              : "inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-sunken disabled:opacity-50"
          }
        >
          <FileText size={15} />
          Create Invoice
        </button>
      )}
    />
  );
}
