-- Agencies now white-label the whole app (accent colour derived from
-- brand_color, see src/lib/color.ts), not just the client portal/PDFs.
-- New agencies should default to Powerhouse's own purple, not the old
-- green placeholder, so a fresh signup looks like Powerhouse until the
-- agency deliberately picks a colour. Column default only — no data change.
ALTER TABLE "agencies" ALTER COLUMN "brand_color" SET DEFAULT '#9933ff';
