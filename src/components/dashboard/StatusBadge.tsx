import type { InvoiceStatus } from "@/lib/demo-data";

const MAP: Record<InvoiceStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-profit-soft text-profit" },
  sent: { label: "Sent", className: "bg-accent-soft text-accent-strong" },
  overdue: { label: "Overdue", className: "bg-loss-soft text-loss" },
  draft: { label: "Draft", className: "bg-surface-sunken text-ink-2" },
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s = MAP[status];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
