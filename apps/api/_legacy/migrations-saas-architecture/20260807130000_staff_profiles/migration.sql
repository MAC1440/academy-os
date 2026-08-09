CREATE TYPE "StaffType" AS ENUM ('TEACHER', 'STAFF');

CREATE TABLE "StaffProfile" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "StaffType" NOT NULL DEFAULT 'TEACHER',
    "employeeCode" TEXT,
    "pinHash" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StaffBranchAssignment" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffBranchAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffProfile_academyId_userId_key" ON "StaffProfile"("academyId", "userId");
CREATE INDEX "StaffProfile_academyId_type_status_idx" ON "StaffProfile"("academyId", "type", "status");
CREATE UNIQUE INDEX "StaffBranchAssignment_staffId_branchId_key" ON "StaffBranchAssignment"("staffId", "branchId");
CREATE INDEX "StaffBranchAssignment_branchId_idx" ON "StaffBranchAssignment"("branchId");

ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffProfile" ADD CONSTRAINT "StaffProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffBranchAssignment" ADD CONSTRAINT "StaffBranchAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffBranchAssignment" ADD CONSTRAINT "StaffBranchAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
