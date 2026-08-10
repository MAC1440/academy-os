CREATE TABLE "SchoolClassCurriculumSubject" (
    "id" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,
    "academicGroupId" TEXT,
    "subjectId" TEXT NOT NULL,
    CONSTRAINT "SchoolClassCurriculumSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SchoolClassCurriculumSubject_schoolClassId_academicGroupId_subjectId_key" ON "SchoolClassCurriculumSubject"("schoolClassId", "academicGroupId", "subjectId");
CREATE INDEX "SchoolClassCurriculumSubject_schoolClassId_academicGroupId_idx" ON "SchoolClassCurriculumSubject"("schoolClassId", "academicGroupId");
ALTER TABLE "SchoolClassCurriculumSubject" ADD CONSTRAINT "SchoolClassCurriculumSubject_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolClassCurriculumSubject" ADD CONSTRAINT "SchoolClassCurriculumSubject_academicGroupId_fkey" FOREIGN KEY ("academicGroupId") REFERENCES "AcademicGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolClassCurriculumSubject" ADD CONSTRAINT "SchoolClassCurriculumSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
