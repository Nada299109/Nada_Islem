-- PayrollRecord extensions
ALTER TABLE "PayrollRecord"
  ADD COLUMN "filename"    TEXT,
  ADD COLUMN "size"        INTEGER,
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Default status switches to draft
ALTER TABLE "PayrollRecord" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
CREATE UNIQUE INDEX IF NOT EXISTS "PayrollRecord_employeeId_period_key"
  ON "PayrollRecord"("employeeId","period");

-- PayrollAccessLog
CREATE TABLE "PayrollAccessLog" (
  "id"        TEXT NOT NULL,
  "payrollId" TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "action"    TEXT NOT NULL,
  "ip"        TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PayrollAccessLog_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PayrollAccessLog"
  ADD CONSTRAINT "PayrollAccessLog_payrollId_fkey"
  FOREIGN KEY ("payrollId") REFERENCES "PayrollRecord"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PayrollAccessLog_payrollId_action_idx"
  ON "PayrollAccessLog"("payrollId","action");

-- Immutability triggers (charge.docx §4.8 audit logs immutable)
CREATE OR REPLACE FUNCTION reject_payroll_access_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'PayrollAccessLog is append-only.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payroll_log_no_update ON "PayrollAccessLog";
CREATE TRIGGER payroll_log_no_update
  BEFORE UPDATE ON "PayrollAccessLog"
  FOR EACH ROW EXECUTE FUNCTION reject_payroll_access_log_mutation();

DROP TRIGGER IF EXISTS payroll_log_no_delete ON "PayrollAccessLog";
CREATE TRIGGER payroll_log_no_delete
  BEFORE DELETE ON "PayrollAccessLog"
  FOR EACH ROW EXECUTE FUNCTION reject_payroll_access_log_mutation();
