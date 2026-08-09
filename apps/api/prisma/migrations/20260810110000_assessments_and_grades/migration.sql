CREATE TYPE "AssessmentType" AS ENUM ('REGULAR', 'FESTIVAL');
CREATE TABLE "Assessment" (
  "id" TEXT NOT NULL, "academicOfferingId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "assessmentType" "AssessmentType" NOT NULL, "heldOn" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "StudentAssessmentMark" (
  "id" TEXT NOT NULL, "assessmentId" TEXT NOT NULL, "studentId" TEXT NOT NULL, "subjectId" TEXT NOT NULL,
  "maximumMarks" DECIMAL(8,2) NOT NULL, "obtainedMarks" DECIMAL(8,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentAssessmentMark_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentAssessmentMark_marks_check" CHECK ("maximumMarks" > 0 AND "obtainedMarks" >= 0 AND "obtainedMarks" <= "maximumMarks")
);
CREATE UNIQUE INDEX "StudentAssessmentMark_assessmentId_studentId_subjectId_key" ON "StudentAssessmentMark"("assessmentId", "studentId", "subjectId");
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academicOfferingId_fkey" FOREIGN KEY ("academicOfferingId") REFERENCES "AcademicOffering"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentAssessmentMark" ADD CONSTRAINT "StudentAssessmentMark_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentAssessmentMark" ADD CONSTRAINT "StudentAssessmentMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentAssessmentMark" ADD CONSTRAINT "StudentAssessmentMark_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
