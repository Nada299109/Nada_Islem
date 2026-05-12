ALTER TABLE "Employee"
  ADD COLUMN "contractType"      TEXT,
  ADD COLUMN "workLocation"      TEXT,
  ADD COLUMN "salaryGrade"       TEXT,
  ADD COLUMN "probationEndDate"  TIMESTAMP(3),
  ADD COLUMN "hrNotes"           TEXT,
  ADD COLUMN "emergencyName"     TEXT,
  ADD COLUMN "emergencyPhone"    TEXT,
  ADD COLUMN "emergencyRelation" TEXT;

CREATE INDEX IF NOT EXISTS "Employee_status_idx"       ON "Employee"("status");
CREATE INDEX IF NOT EXISTS "Employee_contractType_idx" ON "Employee"("contractType");
