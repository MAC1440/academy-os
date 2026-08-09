CREATE TYPE "CalendarDayType" AS ENUM ('HOLIDAY', 'OFF_DAY');

CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationWorkingDay" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrganizationWorkingDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AcademicCalendarDay" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "CalendarDayType" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicCalendarDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicYear_academyId_name_key" ON "AcademicYear"("academyId", "name");
CREATE INDEX "AcademicYear_academyId_startsOn_endsOn_idx" ON "AcademicYear"("academyId", "startsOn", "endsOn");
CREATE UNIQUE INDEX "OrganizationWorkingDay_academyId_weekday_key" ON "OrganizationWorkingDay"("academyId", "weekday");
CREATE UNIQUE INDEX "AcademicCalendarDay_academyId_date_key" ON "AcademicCalendarDay"("academyId", "date");
CREATE INDEX "AcademicCalendarDay_academyId_date_idx" ON "AcademicCalendarDay"("academyId", "date");

ALTER TABLE "AcademicYear" ADD CONSTRAINT "AcademicYear_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationWorkingDay" ADD CONSTRAINT "OrganizationWorkingDay_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicCalendarDay" ADD CONSTRAINT "AcademicCalendarDay_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
