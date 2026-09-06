-- Invoice numbers are unique per agency, not globally.
DROP INDEX "invoices_invoice_number_key";
CREATE UNIQUE INDEX "invoices_agency_id_invoice_number_key" ON "invoices"("agency_id", "invoice_number");
