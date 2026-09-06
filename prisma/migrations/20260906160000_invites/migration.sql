CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "agency_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invited_by" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invites_token_key" ON "invites"("token");
CREATE INDEX "invites_agency_id_idx" ON "invites"("agency_id");

ALTER TABLE "invites" ADD CONSTRAINT "invites_agency_id_fkey"
  FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: no policy -> anon/authenticated fully denied; the app (postgres, BYPASSRLS) is unaffected.
ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;
