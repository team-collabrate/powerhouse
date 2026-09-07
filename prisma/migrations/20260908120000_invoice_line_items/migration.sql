-- Itemised invoices: a single tax rate + a line-item table.
-- `invoices.amount` stays the computed total so existing reads are unchanged.

ALTER TABLE "invoices"
  ADD COLUMN "tax_rate_pct" DECIMAL(65,30) NOT NULL DEFAULT 0;

CREATE TABLE "invoice_line_items" (
  "id"          TEXT NOT NULL,
  "invoice_id"  TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity"    DECIMAL(65,30) NOT NULL DEFAULT 1,
  "unit_price"  DECIMAL(65,30) NOT NULL DEFAULT 0,
  "position"    INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items" ("invoice_id");

ALTER TABLE "invoice_line_items"
  ADD CONSTRAINT "invoice_line_items_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: same posture as every other table — enabled, agency-scoped SELECT,
-- no anon/authenticated write policy (the app connects as BYPASSRLS postgres).
ALTER TABLE "invoice_line_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoice_line_items_tenant_read" ON "invoice_line_items"
  FOR SELECT USING (
    "invoice_id" IN (SELECT "id" FROM "invoices" WHERE "agency_id" = public.current_agency_id())
  );

-- Backfill: one line item per existing invoice, priced at its current amount.
INSERT INTO "invoice_line_items" ("id", "invoice_id", "description", "quantity", "unit_price", "position")
SELECT
  gen_random_uuid()::text,
  i."id",
  COALESCE(p."name", 'Services rendered'),
  1,
  i."amount",
  0
FROM "invoices" i
LEFT JOIN "projects" p ON p."id" = i."project_id";
