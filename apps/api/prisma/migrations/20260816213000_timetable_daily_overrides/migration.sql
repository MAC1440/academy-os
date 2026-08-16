-- One-day substitutes for a regular timetable assignment. The weekly timetable
-- remains unchanged; the override only applies on its stored calendar date.
CREATE TABLE "TimetableDailyOverride" (
    "id" TEXT NOT NULL,
    "timetableAssignmentId" TEXT NOT NULL,
    "overrideStaffProfileId" TEXT NOT NULL,
    "overrideDate" DATE NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimetableDailyOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TimetableDailyOverride_timetableAssignmentId_overrideDate_key"
ON "TimetableDailyOverride"("timetableAssignmentId", "overrideDate");

CREATE INDEX "TimetableDailyOverride_overrideStaffProfileId_overrideDate_idx"
ON "TimetableDailyOverride"("overrideStaffProfileId", "overrideDate");

CREATE INDEX "TimetableDailyOverride_overrideDate_idx"
ON "TimetableDailyOverride"("overrideDate");

ALTER TABLE "TimetableDailyOverride"
ADD CONSTRAINT "TimetableDailyOverride_timetableAssignmentId_fkey"
FOREIGN KEY ("timetableAssignmentId") REFERENCES "TimetableAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TimetableDailyOverride"
ADD CONSTRAINT "TimetableDailyOverride_overrideStaffProfileId_fkey"
FOREIGN KEY ("overrideStaffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
