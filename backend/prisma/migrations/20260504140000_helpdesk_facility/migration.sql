-- Ticket extensions
ALTER TABLE "Ticket"
  ADD COLUMN "closedAt"            TIMESTAMP(3),
  ADD COLUMN "slaPausedAt"         TIMESTAMP(3),
  ADD COLUMN "slaPausedDurationMs" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "escalationLevel"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "resolutionRating"    INTEGER,
  ADD COLUMN "resolutionFeedback"  TEXT,
  ADD COLUMN "mergedIntoId"        TEXT,
  ADD COLUMN "facilityRequestId"   TEXT;

ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_mergedIntoId_fkey"
  FOREIGN KEY ("mergedIntoId") REFERENCES "Ticket"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
-- TicketComment
CREATE TABLE IF NOT EXISTS "TicketComment" (
  "id"         TEXT NOT NULL,
  "ticketId"   TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "content"    TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TicketComment"
  ADD CONSTRAINT "TicketComment_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
-- TicketComment internal flag
ALTER TABLE "TicketComment" ADD COLUMN "isInternal" BOOLEAN NOT NULL DEFAULT false;

-- TicketAttachment
CREATE TABLE "TicketAttachment" (
  "id"           TEXT NOT NULL,
  "ticketId"     TEXT NOT NULL,
  "url"          TEXT NOT NULL,
  "filename"     TEXT NOT NULL,
  "size"         INTEGER NOT NULL,
  "mime"         TEXT NOT NULL,
  "isResolution" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TicketAttachment"
  ADD CONSTRAINT "TicketAttachment_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- FacilityLocation
CREATE TABLE "FacilityLocation" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "type"         TEXT NOT NULL,
  "building"     TEXT,
  "floor"        TEXT,
  "departmentId" TEXT,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "FacilityLocation_pkey" PRIMARY KEY ("id")
);

-- FacilityAsset
CREATE TABLE "FacilityAsset" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "type"         TEXT,
  "serialNumber" TEXT,
  "purchaseDate" TIMESTAMP(3),
  "status"       TEXT NOT NULL DEFAULT 'active',
  "locationId"   TEXT NOT NULL,
  CONSTRAINT "FacilityAsset_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FacilityAsset"
  ADD CONSTRAINT "FacilityAsset_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "FacilityLocation"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- FacilityRequest
CREATE TABLE "FacilityRequest" (
  "id"                 TEXT NOT NULL,
  "title"              TEXT NOT NULL,
  "description"        TEXT NOT NULL,
  "issueType"          TEXT NOT NULL,
  "urgency"            TEXT NOT NULL DEFAULT 'normal',
  "status"             TEXT NOT NULL DEFAULT 'open',
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  "reporterEmployeeId" TEXT NOT NULL,
  "locationId"         TEXT NOT NULL,
  "assetId"            TEXT,
  CONSTRAINT "FacilityRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FacilityRequest"
  ADD CONSTRAINT "FacilityRequest_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "FacilityLocation"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FacilityRequest"
  ADD CONSTRAINT "FacilityRequest_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "FacilityAsset"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Ticket_facilityRequestId_key" ON "Ticket"("facilityRequestId");

ALTER TABLE "Ticket"
  ADD CONSTRAINT "Ticket_facilityRequestId_fkey"
  FOREIGN KEY ("facilityRequestId") REFERENCES "FacilityRequest"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- FacilityPhoto
CREATE TABLE "FacilityPhoto" (
  "id"                TEXT NOT NULL,
  "url"               TEXT NOT NULL,
  "filename"          TEXT NOT NULL,
  "size"              INTEGER NOT NULL,
  "facilityRequestId" TEXT NOT NULL,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FacilityPhoto_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FacilityPhoto"
  ADD CONSTRAINT "FacilityPhoto_facilityRequestId_fkey"
  FOREIGN KEY ("facilityRequestId") REFERENCES "FacilityRequest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
