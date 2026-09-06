export const ROLES = ["admin", "manager", "team_member", "client"] as const;
export type Role = (typeof ROLES)[number];

export type Capability =
  | "project:write"
  | "client:write"
  | "expense:write"
  | "invoice:write"
  | "payment:write"
  | "team:manage"
  | "settings:manage";

/**
 * What each role may do in the main app.
 *   admin        — everything
 *   manager      — all project + financial operations
 *   team_member  — read everything, log expenses only
 *   client       — no main-app access (they use a portal link)
 */
const MATRIX: Record<Role, Capability[]> = {
  admin: [
    "project:write",
    "client:write",
    "expense:write",
    "invoice:write",
    "payment:write",
    "team:manage",
    "settings:manage",
  ],
  manager: [
    "project:write",
    "client:write",
    "expense:write",
    "invoice:write",
    "payment:write",
  ],
  team_member: ["expense:write"],
  client: [],
};

export function can(role: string, capability: Capability): boolean {
  return (MATRIX[role as Role] ?? []).includes(capability);
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  team_member: "Team member",
  client: "Client",
};
