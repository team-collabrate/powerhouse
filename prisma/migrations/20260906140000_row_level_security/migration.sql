-- Row-Level Security — defence-in-depth for multi-tenant isolation.
--
-- The app connects to Postgres as `postgres` (BYPASSRLS), so Prisma queries
-- are unaffected and still rely on the app layer's agencyId filters. These
-- policies close direct access via Supabase PostgREST + the public anon key:
-- with no user JWT `current_agency_id()` is NULL and every policy denies,
-- and with a user JWT a caller only sees their own agency. No write policies
-- are granted to anon/authenticated, so PostgREST writes are blocked entirely.

CREATE OR REPLACE FUNCTION public.current_agency_id()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT agency_id FROM public.users WHERE id = auth.uid()::text
$$;

GRANT EXECUTE ON FUNCTION public.current_agency_id() TO anon, authenticated;

ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agencies_tenant_read" ON "agencies"
  FOR SELECT USING ("id" = public.current_agency_id());

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_tenant_read" ON "users"
  FOR SELECT USING ("agency_id" = public.current_agency_id());

ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_tenant_read" ON "clients"
  FOR SELECT USING ("agency_id" = public.current_agency_id());

ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_tenant_read" ON "projects"
  FOR SELECT USING ("agency_id" = public.current_agency_id());

ALTER TABLE "project_expenses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_expenses_tenant_read" ON "project_expenses"
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM "projects" p
    WHERE p."id" = "project_expenses"."project_id"
      AND p."agency_id" = public.current_agency_id()));

ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_tenant_read" ON "milestones"
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM "projects" p
    WHERE p."id" = "milestones"."project_id"
      AND p."agency_id" = public.current_agency_id()));

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_tenant_read" ON "invoices"
  FOR SELECT USING ("agency_id" = public.current_agency_id());

ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_tenant_read" ON "payments"
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM "invoices" i
    WHERE i."id" = "payments"."invoice_id"
      AND i."agency_id" = public.current_agency_id()));

ALTER TABLE "company_expenses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_expenses_tenant_read" ON "company_expenses"
  FOR SELECT USING ("agency_id" = public.current_agency_id());

ALTER TABLE "activity_log" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_log_tenant_read" ON "activity_log"
  FOR SELECT USING ("agency_id" = public.current_agency_id());
