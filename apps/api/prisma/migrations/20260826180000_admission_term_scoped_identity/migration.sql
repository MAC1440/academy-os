ALTER TABLE "AdmissionApplication"
ADD COLUMN "academicTermId" TEXT;

UPDATE "AdmissionApplication" AS application
SET "academicTermId" = student."academicTermId"
FROM "Student" AS student
WHERE student."admissionApplicationId" = application."id";

DROP INDEX "AdmissionApplication_academicOfferingId_studentCnic_key";
DROP INDEX "Student_academicOfferingId_studentCnic_key";

CREATE UNIQUE INDEX "AdmissionApplication_academicOfferingId_academicTermId_studentCnic_key"
ON "AdmissionApplication"("academicOfferingId", "academicTermId", "studentCnic");

CREATE UNIQUE INDEX "AdmissionApplication_pending_student_offering_key"
ON "AdmissionApplication"("academicOfferingId", "studentCnic")
WHERE "status" = 'PENDING' AND "deletedAt" IS NULL;

CREATE INDEX "AdmissionApplication_academicTermId_idx"
ON "AdmissionApplication"("academicTermId");

CREATE UNIQUE INDEX "Student_academicOfferingId_academicTermId_studentCnic_key"
ON "Student"("academicOfferingId", "academicTermId", "studentCnic");

ALTER TABLE "AdmissionApplication"
ADD CONSTRAINT "AdmissionApplication_academicTermId_fkey"
FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
