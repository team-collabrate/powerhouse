import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { getSessionContext, type SessionContext } from "@/lib/session";
import { can, type Capability } from "@/lib/permissions";

export function ok<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(
    { success: true, data, meta: { timestamp: new Date().toISOString() } },
    { status: init?.status ?? 200 },
  );
}

export function fail(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      meta: { timestamp: new Date().toISOString() },
    },
    { status },
  );
}

export function validationError(err: ZodError) {
  return fail(
    "VALIDATION_ERROR",
    "Invalid input",
    400,
    err.issues.map((i) => ({ field: i.path.join("."), issue: i.message })),
  );
}

/**
 * Returns the session context, or a 401 response. Usage:
 *   const auth = await requireSession();
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireSession(): Promise<SessionContext | NextResponse> {
  const ctx = await getSessionContext();
  if (!ctx) return fail("UNAUTHORIZED", "Not signed in", 401);
  return ctx;
}

/**
 * Like requireSession, but also 403s if the role lacks the capability.
 *   const auth = await requireCapability("project:write");
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireCapability(
  capability: Capability,
): Promise<SessionContext | NextResponse> {
  const ctx = await getSessionContext();
  if (!ctx) return fail("UNAUTHORIZED", "Not signed in", 401);
  if (!can(ctx.role, capability)) {
    return fail(
      "FORBIDDEN",
      `Your role (${ctx.role}) can't perform this action`,
      403,
    );
  }
  return ctx;
}
