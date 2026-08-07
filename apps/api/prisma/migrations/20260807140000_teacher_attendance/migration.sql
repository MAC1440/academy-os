CREATE TABLE "TeacherAttendance" (
    "id" TEXT NOT NULL, "staffId" TEXT NOT NULL, "branchId" TEXT NOT NULL,
    "schoolDate" TIMESTAMP(3) NOT NULL, "checkedInAt" TIMESTAMP(3) NOT NULL,
    "checkedOutAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "TeacherAttendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TeacherAttendance_staffId_branchId_schoolDate_key" ON "TeacherAttendance"("staffId", "branchId", "schoolDate");
CREATE INDEX "TeacherAttendance_branchId_schoolDate_idx" ON "TeacherAttendance"("branchId", "schoolDate");
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAttendance" ADD CONSTRAINT "TeacherAttendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
