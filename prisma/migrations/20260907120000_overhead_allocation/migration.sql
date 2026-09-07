-- Agency-level overhead allocation rule.
-- `overhead_method` = manual | percent | even | contract_share (default preserves prior behaviour).
-- `overhead_rate` = fraction 0..1, applied to contract value when method = percent.
ALTER TABLE "agencies"
  ADD COLUMN "overhead_method" TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN "overhead_rate"   DECIMAL(65,30) NOT NULL DEFAULT 0;
