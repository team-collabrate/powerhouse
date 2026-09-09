-- Per-agency reply-to address for outbound invoice / invite emails.
-- NULL = fall back to the platform default sender.
ALTER TABLE "agencies" ADD COLUMN "reply_to_email" TEXT;
