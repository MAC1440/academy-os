CREATE TYPE "AdmissionSource" AS ENUM ('WEBSITE', 'ADMIN_ENTRY', 'WALK_IN', 'IMPORT');
ALTER TABLE "AdmissionApplication" ADD COLUMN "source" "AdmissionSource" NOT NULL DEFAULT 'ADMIN_ENTRY';
