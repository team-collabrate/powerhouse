import { prisma } from "@/lib/prisma";
import { cacheAgencyRead } from "@/lib/cache";

export interface AgencyBranding {
  name: string;
  logoUrl: string | null;
  brandColor: string;
}

async function fetchAgencyBranding(agencyId: string): Promise<AgencyBranding> {
  const a = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: { name: true, logoUrl: true, brandColor: true },
  });
  return a ?? { name: "Powerhouse", logoUrl: null, brandColor: "" };
}

/** White-label bits for the signed-in layout: name/logo/colour, cheap + cached. */
export const getAgencyBranding = cacheAgencyRead(
  fetchAgencyBranding,
  ["agency-branding"],
  120,
);
