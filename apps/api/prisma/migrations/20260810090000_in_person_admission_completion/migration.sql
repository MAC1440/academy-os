ALTER TABLE "AdmissionApplication"
  ADD COLUMN "formData" JSONB,
  ADD COLUMN "physicalDocumentsVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "physicalDocumentsVerificationNote" TEXT;

ALTER TABLE "Student"
  ADD COLUMN "academicTermId" TEXT,
  ADD COLUMN "registrationNumber" TEXT,
  ADD COLUMN "monthlyFeeAmount" DECIMAL(12,2),
  ADD COLUMN "amountReceivedWithForm" DECIMAL(12,2),
  ADD COLUMN "openingBalanceAmount" DECIMAL(12,2),
  ADD COLUMN "receiptNumber" TEXT,
  ADD COLUMN "balanceDueOn" DATE,
  ADD COLUMN "admissionRemarks" TEXT,
  ADD COLUMN "admissionOfficerName" TEXT;

CREATE UNIQUE INDEX "Student_registrationNumber_key" ON "Student"("registrationNumber");
ALTER TABLE "Student" ADD CONSTRAINT "Student_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
