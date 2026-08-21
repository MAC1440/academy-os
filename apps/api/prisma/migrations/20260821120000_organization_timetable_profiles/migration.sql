ALTER TYPE "TimetableProfileScope" ADD VALUE IF NOT EXISTS 'ORGANIZATION' BEFORE 'BRANCH';

ALTER TABLE "TimetableProfile"
ADD COLUMN "organizationId" TEXT;

UPDATE "TimetableProfile" AS profile
SET "organizationId" = branch."organizationId"
FROM "Branch" AS branch
WHERE profile."branchId" = branch."id";

ALTER TABLE "TimetableProfile"
ALTER COLUMN "organizationId" SET NOT NULL,
ALTER COLUMN "branchId" DROP NOT NULL;

ALTER TABLE "TimetableProfile"
ADD CONSTRAINT "TimetableProfile_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "TimetableProfile_organizationId_scope_isActive_idx"
ON "TimetableProfile"("organizationId", "scope", "isActive");
