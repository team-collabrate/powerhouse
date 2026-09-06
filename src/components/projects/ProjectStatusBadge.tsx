import type { ProjectStatus } from "@/lib/queries/projects";

const MAP: Record<ProjectStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-profit-soft text-profit" },
  in_review: { label: "In Review", className: "bg-pending-soft text-pending" },
  delivered: { label: "Delivered", className: "bg-accent-soft text-accent-strong" },
  closed: { label: "Closed", className: "bg-surface-sunken text-ink-2" },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const s = MAP[status] ?? MAP.closed;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}
