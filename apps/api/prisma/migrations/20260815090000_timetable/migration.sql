-- CreateEnum
CREATE TYPE "TimetableProfileScope" AS ENUM ('BRANCH', 'CLASS_OVERRIDE');

-- CreateEnum
CREATE TYPE "TimetableMode" AS ENUM ('SAME_DAILY', 'DAY_SPECIFIC');

-- CreateEnum
CREATE TYPE "TimetableSlotType" AS ENUM ('ASSEMBLY', 'TEACHING', 'BREAK');

-- CreateTable
CREATE TABLE "TimetableProfile" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "academicOfferingId" TEXT,
    "name" TEXT NOT NULL,
    "scope" "TimetableProfileScope" NOT NULL,
    "timetableMode" "TimetableMode" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "TimetableProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableSlot" (
    "id" TEXT NOT NULL,
    "timetableProfileId" TEXT NOT NULL,
    "weekday" "Weekday",
    "slotType" "TimetableSlotType" NOT NULL,
    "periodNumber" INTEGER,
    "startsAt" TEXT NOT NULL,
    "endsAt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TimetableSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableAssignment" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "academicOfferingId" TEXT NOT NULL,
    "timetableProfileId" TEXT NOT NULL,
    "timetableSlotId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TimetableAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimetableProfile_branchId_scope_isActive_idx" ON "TimetableProfile"("branchId", "scope", "isActive");
CREATE INDEX "TimetableProfile_academicOfferingId_isActive_idx" ON "TimetableProfile"("academicOfferingId", "isActive");
CREATE UNIQUE INDEX "TimetableSlot_timetableProfileId_weekday_slotType_periodNumber_key" ON "TimetableSlot"("timetableProfileId", "weekday", "slotType", "periodNumber");
CREATE INDEX "TimetableSlot_timetableProfileId_weekday_idx" ON "TimetableSlot"("timetableProfileId", "weekday");
CREATE UNIQUE INDEX "TimetableAssignment_academicOfferingId_timetableSlotId_key" ON "TimetableAssignment"("academicOfferingId", "timetableSlotId");
CREATE INDEX "TimetableAssignment_staffProfileId_idx" ON "TimetableAssignment"("staffProfileId");
CREATE INDEX "TimetableAssignment_branchId_academicOfferingId_idx" ON "TimetableAssignment"("branchId", "academicOfferingId");

-- AddForeignKey
ALTER TABLE "TimetableProfile" ADD CONSTRAINT "TimetableProfile_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableProfile" ADD CONSTRAINT "TimetableProfile_academicOfferingId_fkey" FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableSlot" ADD CONSTRAINT "TimetableSlot_timetableProfileId_fkey" FOREIGN KEY ("timetableProfileId") REFERENCES "TimetableProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableAssignment" ADD CONSTRAINT "TimetableAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableAssignment" ADD CONSTRAINT "TimetableAssignment_academicOfferingId_fkey" FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableAssignment" ADD CONSTRAINT "TimetableAssignment_timetableProfileId_fkey" FOREIGN KEY ("timetableProfileId") REFERENCES "TimetableProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableAssignment" ADD CONSTRAINT "TimetableAssignment_timetableSlotId_fkey" FOREIGN KEY ("timetableSlotId") REFERENCES "TimetableSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimetableAssignment" ADD CONSTRAINT "TimetableAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimetableAssignment" ADD CONSTRAINT "TimetableAssignment_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
