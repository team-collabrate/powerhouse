import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image, favicon.ico
     * - image / font files
     * - /portal/* (token-based public client portal)
     * - /invite/*  (token-based public teammate invite)
     */
    "/((?!_next/static|_next/image|favicon.ico|portal|invite|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
