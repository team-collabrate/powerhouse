import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bustAgencyData } from "@/lib/cache";

/**
 * Append an audit-trail entry. Best-effort — never throw into the caller.
 * Also drops the agency-scoped read cache: every mutation route calls this,
 * so cached dashboard/analytics views reflect the write immediately.
 */
export async function logActivity(entry: {
  agencyId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        agencyId: entry.agencyId,
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        description: entry.description,
        metadata: (entry.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("logActivity failed", err);
  }
  bustAgencyData();
}
