import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Vercel's serverless functions run far from the Supabase (Singapore) DB, so
 * every query is a ~500ms round trip. The heavy read-only aggregates
 * (dashboard, analytics) are wrapped in a short-lived cache keyed by agency
 * id; any write busts it immediately via `bustAgencyData()` (called from
 * `logActivity`, which every mutation route already invokes), and a time
 * limit is the backstop if a write path ever forgets.
 */
export const AGENCY_DATA_TAG = "agency-data";

/**
 * Wrap an agency-scoped read. The cache key is `keyParts` plus the JSON of
 * every argument, so the first arg should be the agency id.
 */
export function cacheAgencyRead<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  ttlSeconds = 60,
): (...args: A) => Promise<R> {
  return unstable_cache(fn, keyParts, {
    revalidate: ttlSeconds,
    tags: [AGENCY_DATA_TAG],
  });
}

/** Drop every cached agency read. Safe to call from any route handler. */
export function bustAgencyData(): void {
  try {
    // Next 16: second arg is a cacheLife profile or { expire }; expire now.
    revalidateTag(AGENCY_DATA_TAG, { expire: 0 });
  } catch {
    // outside a request scope (e.g. a script) — nothing to revalidate
  }
}
