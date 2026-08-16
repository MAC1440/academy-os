ALTER TABLE "SharedNote" ADD COLUMN "lastEditedByUserId" TEXT;

ALTER TABLE "SharedNote"
ADD CONSTRAINT "SharedNote_lastEditedByUserId_fkey"
FOREIGN KEY ("lastEditedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "SharedNote_lastEditedByUserId_idx" ON "SharedNote"("lastEditedByUserId");
