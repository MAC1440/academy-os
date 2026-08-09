CREATE TYPE "StudentAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE');
CREATE TABLE "StudentAttendance" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "attendanceDate" DATE NOT NULL,
  "status" "StudentAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
  "markedByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentAttendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StudentAttendance_studentId_attendanceDate_key" ON "StudentAttendance"("studentId", "attendanceDate");
CREATE INDEX "StudentAttendance_attendanceDate_idx" ON "StudentAttendance"("attendanceDate");
ALTER TABLE "StudentAttendance" ADD CONSTRAINT "StudentAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
