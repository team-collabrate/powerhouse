// Client-safe project constants — kept out of `queries/projects.ts` so
// client components can import them without pulling in the server cache layer.

export const PROJECT_STATUSES = [
  "active",
  "in_review",
  "delivered",
  "closed",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  in_review: "In Review",
  delivered: "Delivered",
  closed: "Closed",
};
