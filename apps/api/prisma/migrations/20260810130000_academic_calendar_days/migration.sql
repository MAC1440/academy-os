CREATE TYPE "CalendarDayType" AS ENUM ('HOLIDAY', 'OFF_DAY');
CREATE TABLE "AcademicCalendarDay" ("id" TEXT NOT NULL,"organizationId" TEXT NOT NULL,"calendarDate" DATE NOT NULL,"dayType" "CalendarDayType" NOT NULL,"label" TEXT,CONSTRAINT "AcademicCalendarDay_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "AcademicCalendarDay_organizationId_calendarDate_key" ON "AcademicCalendarDay"("organizationId","calendarDate");
ALTER TABLE "AcademicCalendarDay" ADD CONSTRAINT "AcademicCalendarDay_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
