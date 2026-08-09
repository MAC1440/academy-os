-- Allow one guardian portal to be linked to multiple students while retaining
-- staff-contact uniqueness through a partial index.
DROP INDEX "User_contactNumber_key";
CREATE UNIQUE INDEX "User_active_staff_contact_number_key"
ON "User"("contactNumber")
WHERE "accountType" = 'STAFF' AND "deletedAt" IS NULL;

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AdmissionApplication" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "academicOfferingId" TEXT NOT NULL,
    "studentFullName" TEXT NOT NULL,
    "studentCnic" TEXT NOT NULL,
    "guardianFullName" TEXT NOT NULL,
    "guardianContactNumber" TEXT NOT NULL,
    "previousSchool" TEXT,
    "previousPerformance" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "AdmissionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "admissionApplicationId" TEXT NOT NULL,
    "guardianPortalUserId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "academicOfferingId" TEXT NOT NULL,
    "studentFullName" TEXT NOT NULL,
    "studentCnic" TEXT NOT NULL,
    "guardianFullName" TEXT NOT NULL,
    "guardianContactNumber" TEXT NOT NULL,
    "previousSchool" TEXT,
    "previousPerformance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionApplication_academicOfferingId_studentCnic_key" ON "AdmissionApplication"("academicOfferingId", "studentCnic");
CREATE INDEX "AdmissionApplication_branchId_status_idx" ON "AdmissionApplication"("branchId", "status");
CREATE INDEX "AdmissionApplication_organizationId_status_idx" ON "AdmissionApplication"("organizationId", "status");
CREATE UNIQUE INDEX "Student_admissionApplicationId_key" ON "Student"("admissionApplicationId");
CREATE UNIQUE INDEX "Student_academicOfferingId_studentCnic_key" ON "Student"("academicOfferingId", "studentCnic");
CREATE INDEX "Student_guardianPortalUserId_idx" ON "Student"("guardianPortalUserId");
CREATE INDEX "Student_branchId_idx" ON "Student"("branchId");

-- AddForeignKey
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdmissionApplication" ADD CONSTRAINT "AdmissionApplication_academicOfferingId_fkey" FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_admissionApplicationId_fkey" FOREIGN KEY ("admissionApplicationId") REFERENCES "AdmissionApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_guardianPortalUserId_fkey" FOREIGN KEY ("guardianPortalUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_academicOfferingId_fkey" FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
