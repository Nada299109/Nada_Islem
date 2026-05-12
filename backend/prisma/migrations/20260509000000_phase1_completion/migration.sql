-- charge.docx Phase-1 completion: audit/notification/leave/document/ticket schema additions.

-- ===== AuditLog: structured old/new values + resource pointer =====
ALTER TABLE "AuditLog"
  ADD COLUMN "resourceId" TEXT,
  ADD COLUMN "oldValue"   TEXT,
  ADD COLUMN "newValue"   TEXT,
  ADD COLUMN IF NOT EXISTS "module" TEXT;

CREATE INDEX IF NOT EXISTS "AuditLog_module_resourceId_idx"
  ON "AuditLog" ("module", "resourceId");

CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx"
  ON "AuditLog" ("userId", "createdAt");

-- ===== Ticket: assignment timestamp for SLA notification timing =====
ALTER TABLE "Ticket"
  ADD COLUMN "assignedAt" TIMESTAMP(3);

-- ===== LeaveRequest: approval workflow tracking =====
ALTER TABLE "LeaveRequest"
  ADD COLUMN "managerApprovalAt" TIMESTAMP(3),
  ADD COLUMN "rejectionReason"   TEXT,
  ADD COLUMN "decidedAt"          TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "LeaveRequest_employeeId_status_idx"
  ON "LeaveRequest" ("employeeId", "status");

CREATE INDEX IF NOT EXISTS "LeaveRequest_startDate_endDate_idx"
  ON "LeaveRequest" ("startDate", "endDate");

-- ===== Document: legal retention + expiry-notification idempotency =====
ALTER TABLE "Document"
  ADD COLUMN "retentionUntil"   TIMESTAMP(3),
  ADD COLUMN "expiryNotifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "type"     TEXT,
  ADD COLUMN IF NOT EXISTS "category" TEXT;

CREATE INDEX IF NOT EXISTS "Document_type_category_idx"
  ON "Document" ("type", "category");

CREATE INDEX IF NOT EXISTS "Document_expiresAt_idx"
  ON "Document" ("expiresAt");