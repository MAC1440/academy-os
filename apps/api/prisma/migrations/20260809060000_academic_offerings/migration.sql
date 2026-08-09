-- CreateEnum
CREATE TYPE "AcademicOfferingType" AS ENUM ('SCHOOL_CLASS', 'COURSE');

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sectionsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicOffering" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "offeringType" "AcademicOfferingType" NOT NULL,
    "schoolClassId" TEXT,
    "courseId" TEXT,
    "sectionName" TEXT,
    "offeringKey" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicOffering_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AcademicOffering_source_check" CHECK (
      ("offeringType" = 'SCHOOL_CLASS' AND "schoolClassId" IS NOT NULL AND "courseId" IS NULL)
      OR ("offeringType" = 'COURSE' AND "courseId" IS NOT NULL AND "schoolClassId" IS NULL)
    )
);

-- CreateTable
CREATE TABLE "AcademicOfferingSubject" (
    "academicOfferingId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "AcademicOfferingSubject_pkey" PRIMARY KEY ("academicOfferingId", "subjectId")
);

-- CreateTable
CREATE TABLE "AcademicOfferingTeacher" (
    "academicOfferingId" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    CONSTRAINT "AcademicOfferingTeacher_pkey" PRIMARY KEY ("academicOfferingId", "staffProfileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_organizationId_name_key" ON "SchoolClass"("organizationId", "name");
CREATE INDEX "SchoolClass_organizationId_status_sortOrder_idx" ON "SchoolClass"("organizationId", "status", "sortOrder");
CREATE UNIQUE INDEX "Course_organizationId_name_key" ON "Course"("organizationId", "name");
CREATE INDEX "Course_organizationId_status_idx" ON "Course"("organizationId", "status");
CREATE UNIQUE INDEX "Subject_organizationId_name_key" ON "Subject"("organizationId", "name");
CREATE INDEX "Subject_organizationId_status_idx" ON "Subject"("organizationId", "status");
CREATE UNIQUE INDEX "AcademicOffering_branchId_offeringKey_key" ON "AcademicOffering"("branchId", "offeringKey");
CREATE INDEX "AcademicOffering_branchId_status_idx" ON "AcademicOffering"("branchId", "status");

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Course" ADD CONSTRAINT "Course_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicOffering" ADD CONSTRAINT "AcademicOffering_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicOffering" ADD CONSTRAINT "AcademicOffering_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicOffering" ADD CONSTRAINT "AcademicOffering_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicOfferingSubject" ADD CONSTRAINT "AcademicOfferingSubject_academicOfferingId_fkey" FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicOfferingSubject" ADD CONSTRAINT "AcademicOfferingSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AcademicOfferingTeacher" ADD CONSTRAINT "AcademicOfferingTeacher_academicOfferingId_fkey" FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AcademicOfferingTeacher" ADD CONSTRAINT "AcademicOfferingTeacher_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
