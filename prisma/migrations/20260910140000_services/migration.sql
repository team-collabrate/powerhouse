-- Per-agency, colour-tagged service types. `Project.serviceType` keeps
-- holding the slug (default slugs match the previous hard-coded enum, so no
-- project rows change).

CREATE TABLE "services" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "agency_id"  TEXT NOT NULL REFERENCES "agencies"("id") ON DELETE CASCADE,
  "slug"       TEXT NOT NULL,
  "name"       TEXT NOT NULL,
  "color"      TEXT NOT NULL DEFAULT '#9333ea',
  "position"   INTEGER NOT NULL DEFAULT 0,
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "services_agency_id_slug_key" ON "services" ("agency_id", "slug");
CREATE INDEX "services_agency_id_idx" ON "services" ("agency_id");

-- RLS: read scoped to the tenant, no anon/authenticated writes (app is BYPASSRLS)
ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_tenant_read" ON "services"
  FOR SELECT USING ("agency_id" = public.current_agency_id());

-- Seed the five built-ins for every existing agency.
INSERT INTO "services" ("id", "agency_id", "slug", "name", "color", "position")
SELECT gen_random_uuid()::text, a."id", d."slug", d."name", d."color", d."position"
FROM "agencies" a
CROSS JOIN (VALUES
  ('web_dev',    'Web Development', '#9333ea', 0),
  ('design',     'Brand & Design',  '#db2777', 1),
  ('marketing',  'Marketing',       '#d97706', 2),
  ('consulting', 'Consulting',      '#16a34a', 3),
  ('other',      'Other',           '#2563eb', 4)
) AS d("slug", "name", "color", "position");
