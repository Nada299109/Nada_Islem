ALTER TABLE "Notification"
  ADD COLUMN "subject"        TEXT,
  ADD COLUMN "channel"        TEXT NOT NULL DEFAULT 'in_app',
  ADD COLUMN "critical"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deliveryStatus" TEXT,
  ADD COLUMN "deliveryError"  TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx"
  ON "Notification"("userId","createdAt");