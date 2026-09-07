import { prisma } from "@/lib/prisma";

export interface ActivityEntry {
  id: string;
  actor: string;
  action: string;
  description: string;
  entityType: string | null;
  entityId: string | null;
  at: string;
}

export interface ActivityPage {
  entries: ActivityEntry[];
  nextCursor: string | null;
}

const PAGE = 40;

/** Human-readable href for the entity an activity row touched, when we can. */
export function activityHref(e: ActivityEntry): string | null {
  if (!e.entityId) return null;
  switch (e.entityType) {
    case "project":
      return `/projects/${e.entityId}`;
    case "client":
      return `/clients/${e.entityId}`;
    case "invoice":
      return `/invoices/${e.entityId}`;
    default:
      return null;
  }
}

export async function getActivity(
  agencyId: string,
  cursor?: string,
): Promise<ActivityPage> {
  const rows = await prisma.activityLog.findMany({
    where: { agencyId },
    orderBy: { createdAt: "desc" },
    take: PAGE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      description: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      user: { select: { fullName: true } },
    },
  });

  const hasMore = rows.length > PAGE;
  const page = hasMore ? rows.slice(0, PAGE) : rows;

  return {
    entries: page.map((r) => ({
      id: r.id,
      actor: r.user?.fullName ?? "Someone",
      action: r.action,
      description: r.description ?? r.action.replace(/_/g, " "),
      entityType: r.entityType,
      entityId: r.entityId,
      at: r.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}
