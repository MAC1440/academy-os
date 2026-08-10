-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_academicTermId_fkey";

-- AlterTable
ALTER TABLE "AcademicOffering" ADD COLUMN     "academicGroupId" TEXT;

-- CreateTable
CREATE TABLE "AcademicGroup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AcademicGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicGroupSchoolClass" (
    "academicGroupId" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,

    CONSTRAINT "AcademicGroupSchoolClass_pkey" PRIMARY KEY ("academicGroupId","schoolClassId")
);

-- CreateIndex
CREATE INDEX "AcademicGroup_organizationId_status_idx" ON "AcademicGroup"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicGroup_organizationId_name_key" ON "AcademicGroup"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "AcademicGroup" ADD CONSTRAINT "AcademicGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicGroupSchoolClass" ADD CONSTRAINT "AcademicGroupSchoolClass_academicGroupId_fkey" FOREIGN KEY ("academicGroupId") REFERENCES "AcademicGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicGroupSchoolClass" ADD CONSTRAINT "AcademicGroupSchoolClass_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicOffering" ADD CONSTRAINT "AcademicOffering_academicGroupId_fkey" FOREIGN KEY ("academicGroupId") REFERENCES "AcademicGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
