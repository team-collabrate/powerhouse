import type { InvoiceStatus } from "@/lib/dashboard-types";

const MAP: Record<InvoiceStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-profit-soft text-profit" },
  partial: { label: "Partial", className: "bg-accent-soft text-accent-strong" },
  sent: { label: "Sent", className: "bg-surface-sunken text-ink-2" },
  overdue: { label: "Overdue", className: "bg-loss-soft text-loss" },
  draft: { label: "Draft", className: "bg-surface-sunken text-ink-3" },
  cancelled: { label: "Cancelled", className: "bg-surface-sunken text-ink-3 line-through" },
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s = MAP[status] ?? MAP.draft;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
