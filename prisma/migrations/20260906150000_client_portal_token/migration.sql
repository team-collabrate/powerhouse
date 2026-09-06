ALTER TABLE "clients" ADD COLUMN "portal_token" TEXT;
CREATE UNIQUE INDEX "clients_portal_token_key" ON "clients"("portal_token");
