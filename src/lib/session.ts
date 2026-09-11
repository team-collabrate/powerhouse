import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export interface SessionContext {
  userId: string;
  agencyId: string;
  fullName: string;
  email: string;
  role: string;
}

const configured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !!process.env.DATABASE_URL;

/**
 * Resolve the signed-in user's agency context. Returns null when Supabase /
 * the database is not configured, when nobody is signed in, or when the auth
 * user has no matching profile row yet; callers fall back to demo data.
 */
export const getSessionContext = cache(
  async (): Promise<SessionContext | null> => {
    if (!configured()) return null;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, agencyId: true, fullName: true, role: true },
      });
      if (!profile) return null;

      return {
        userId: profile.id,
        agencyId: profile.agencyId,
        fullName: profile.fullName,
        email: user.email ?? "",
        role: profile.role,
      };
    } catch {
      return null;
    }
  },
);
