CREATE TYPE "AcademicTermType" AS ENUM ('YEARLY', 'SEMESTER');

ALTER TABLE "SchoolClass" ADD COLUMN "registrationNumberModifier" TEXT;
ALTER TABLE "Course" ADD COLUMN "registrationNumberModifier" TEXT;

CREATE TABLE "AcademicTerm" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "termType" "AcademicTermType" NOT NULL,
  "startsOn" DATE NOT NULL,
  "endsOn" DATE NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AcademicTerm_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AcademicTerm_organizationId_name_key" ON "AcademicTerm"("organizationId", "name");
ALTER TABLE "AcademicTerm" ADD CONSTRAINT "AcademicTerm_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AdmissionRegistrationSettings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "prefix" TEXT NOT NULL DEFAULT 'ADM',
  "sequencePadding" INTEGER NOT NULL DEFAULT 4,
  "nextSequence" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdmissionRegistrationSettings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AdmissionRegistrationSettings_organizationId_key" ON "AdmissionRegistrationSettings"("organizationId");
ALTER TABLE "AdmissionRegistrationSettings" ADD CONSTRAINT "AdmissionRegistrationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
