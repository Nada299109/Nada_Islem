CREATE TABLE IF NOT EXISTS "Department" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "code"      TEXT,
  "managerId" TEXT,
  CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Tool"
  ADD COLUMN "instructions" TEXT,
  ADD COLUMN "iconUrl"      TEXT,
  ADD COLUMN "priority"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isActive"     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "_ToolDepartments" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_ToolDepartments_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE INDEX "_ToolDepartments_B_index" ON "_ToolDepartments"("B");

ALTER TABLE "_ToolDepartments"
  ADD CONSTRAINT "_ToolDepartments_A_fkey" FOREIGN KEY ("A") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ToolDepartments"
  ADD CONSTRAINT "_ToolDepartments_B_fkey" FOREIGN KEY ("B") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Tool_priority_idx" ON "Tool"("priority");
CREATE INDEX IF NOT EXISTS "Tool_isActive_idx" ON "Tool"("isActive");
