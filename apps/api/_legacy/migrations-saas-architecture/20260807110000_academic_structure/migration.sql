-- Organization-level setting and branch-scoped school structure.
CREATE TABLE "AcademicSettings" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "sectionsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassSection" (
    "id" TEXT NOT NULL,
    "schoolClassId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicSettings_academyId_key" ON "AcademicSettings"("academyId");
CREATE UNIQUE INDEX "SchoolClass_branchId_code_key" ON "SchoolClass"("branchId", "code");
CREATE INDEX "SchoolClass_branchId_status_idx" ON "SchoolClass"("branchId", "status");
CREATE UNIQUE INDEX "ClassSection_schoolClassId_code_key" ON "ClassSection"("schoolClassId", "code");
CREATE INDEX "ClassSection_schoolClassId_status_idx" ON "ClassSection"("schoolClassId", "status");

ALTER TABLE "AcademicSettings" ADD CONSTRAINT "AcademicSettings_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "Academy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSection" ADD CONSTRAINT "ClassSection_schoolClassId_fkey" FOREIGN KEY ("schoolClassId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
