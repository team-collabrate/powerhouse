/**
 * Service types are per-agency rows (`Service` model), each with a colour.
 * This module is pure + client-safe (no Prisma) — it holds the colour
 * palette, the built-in defaults, and the slug/label/colour resolvers.
 */

export interface ColorOption {
  name: string;
  value: string;
}

/** The 7 colours a service can be tagged with. */
export const SERVICE_COLOR_OPTIONS: ColorOption[] = [
  { name: "Purple", value: "#9333ea" },
  { name: "Blue", value: "#2563eb" },
  { name: "Teal", value: "#0d9488" },
  { name: "Green", value: "#16a34a" },
  { name: "Amber", value: "#d97706" },
  { name: "Red", value: "#dc2626" },
  { name: "Pink", value: "#db2777" },
];

export const SERVICE_COLORS = SERVICE_COLOR_OPTIONS.map((c) => c.value);
export const DEFAULT_SERVICE_COLOR = SERVICE_COLOR_OPTIONS[0].value;

export function isServiceColor(value: string): boolean {
  return SERVICE_COLORS.includes(value);
}

/** Seeded into every new agency; slugs match the pre-existing enum values. */
export const DEFAULT_SERVICES = [
  { slug: "web_dev", name: "Web Development", color: "#9333ea", position: 0 },
  { slug: "design", name: "Brand & Design", color: "#db2777", position: 1 },
  { slug: "marketing", name: "Marketing", color: "#d97706", position: 2 },
  { slug: "consulting", name: "Consulting", color: "#16a34a", position: 3 },
  { slug: "other", name: "Other", color: "#2563eb", position: 4 },
] as const;

const DEFAULT_BY_SLUG: Record<string, { name: string; color: string }> =
  Object.fromEntries(
    DEFAULT_SERVICES.map((s) => [s.slug, { name: s.name, color: s.color }]),
  );

/** kebab-ish slug, deduped by the caller against existing slugs. */
export function slugifyService(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || "service";
}

export interface ServiceLite {
  slug: string;
  name: string;
  color: string;
}

export function serviceLabel(services: ServiceLite[], slug: string): string {
  return (
    services.find((s) => s.slug === slug)?.name ??
    DEFAULT_BY_SLUG[slug]?.name ??
    slug
  );
}

export function serviceColor(services: ServiceLite[], slug: string): string {
  return (
    services.find((s) => s.slug === slug)?.color ??
    DEFAULT_BY_SLUG[slug]?.color ??
    DEFAULT_SERVICE_COLOR
  );
}
