-- Baseline migration for the pre-existing local AcademyOS schema.
CREATE TYPE "public"."EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

CREATE TABLE "public"."Academy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Academy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Branch" (
    "id" TEXT NOT NULL,
    "academyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" "public"."EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Academy_name_idx" ON "public"."Academy"("name");
CREATE UNIQUE INDEX "Academy_slug_key" ON "public"."Academy"("slug");
CREATE INDEX "Academy_status_idx" ON "public"."Academy"("status");
CREATE INDEX "Branch_academyId_idx" ON "public"."Branch"("academyId");
CREATE INDEX "Branch_name_idx" ON "public"."Branch"("name");
CREATE INDEX "Branch_status_idx" ON "public"."Branch"("status");

ALTER TABLE "public"."Branch" ADD CONSTRAINT "Branch_academyId_fkey"
  FOREIGN KEY ("academyId") REFERENCES "public"."Academy"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
