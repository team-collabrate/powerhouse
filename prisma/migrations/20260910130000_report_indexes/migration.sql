-- Period-scoped reporting (getReport) range-scans invoices by issue date and
-- payments by payment date over windows up to ~24 months. Add covering indexes.
CREATE INDEX IF NOT EXISTS "invoices_issue_date_idx" ON "invoices" ("issue_date");
CREATE INDEX IF NOT EXISTS "payments_payment_date_idx" ON "payments" ("payment_date");
