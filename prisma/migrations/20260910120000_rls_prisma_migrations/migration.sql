-- Supabase linter: "RLS Disabled in Public" on public._prisma_migrations.
--
-- Prisma creates this bookkeeping table itself, so the earlier RLS migration
-- (20260906140000_row_level_security) didn't cover it. It lives in the public
-- schema, which PostgREST exposes via the anon key.
--
-- Enable RLS with NO policies -> anon/authenticated get nothing. Prisma
-- connects as `postgres` (BYPASSRLS), so migrations are unaffected.
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
