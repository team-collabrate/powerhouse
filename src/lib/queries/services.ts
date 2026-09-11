import { prisma } from "@/lib/prisma";
import { cacheAgencyRead } from "@/lib/cache";
import { DEFAULT_SERVICES } from "@/lib/services";

export interface ServiceRow {
  id: string;
  slug: string;
  name: string;
  color: string;
  position: number;
  isActive: boolean;
}

async function fetchServices(agencyId: string): Promise<ServiceRow[]> {
  const rows = await prisma.service.findMany({
    where: { agencyId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      color: true,
      position: true,
      isActive: true,
    },
  });
  return rows;
}

export const getServices = cacheAgencyRead(fetchServices, ["services"], 120);

/** Uncached: for scripts and inside other cached adapters. */
export { fetchServices };

type ServiceWriter = {
  service: {
    createMany: (args: {
      data: {
        agencyId: string;
        slug: string;
        name: string;
        color: string;
        position: number;
      }[];
      skipDuplicates?: boolean;
    }) => Promise<unknown>;
  };
};

/** Seed the built-in services for a freshly created agency. */
export async function ensureDefaultServices(
  tx: ServiceWriter,
  agencyId: string,
): Promise<void> {
  await tx.service.createMany({
    data: DEFAULT_SERVICES.map((s) => ({
      agencyId,
      slug: s.slug,
      name: s.name,
      color: s.color,
      position: s.position,
    })),
    skipDuplicates: true,
  });
}
