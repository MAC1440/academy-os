-- CreateEnum
CREATE TYPE "WebsiteTemplate" AS ENUM ('CLASSIC', 'MODERN', 'MINIMAL');

-- CreateEnum
CREATE TYPE "WebsiteRevisionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "WebsiteConfig" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebsiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteRevision" (
    "id" TEXT NOT NULL,
    "websiteConfigId" TEXT NOT NULL,
    "status" "WebsiteRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    CONSTRAINT "WebsiteRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebsiteConfig_organizationId_key" ON "WebsiteConfig"("organizationId");
CREATE INDEX "WebsiteRevision_websiteConfigId_status_updatedAt_idx" ON "WebsiteRevision"("websiteConfigId", "status", "updatedAt");
CREATE INDEX "WebsiteRevision_websiteConfigId_status_publishedAt_idx" ON "WebsiteRevision"("websiteConfigId", "status", "publishedAt");

ALTER TABLE "WebsiteConfig" ADD CONSTRAINT "WebsiteConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteRevision" ADD CONSTRAINT "WebsiteRevision_websiteConfigId_fkey" FOREIGN KEY ("websiteConfigId") REFERENCES "WebsiteConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteRevision" ADD CONSTRAINT "WebsiteRevision_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WebsiteRevision" ADD CONSTRAINT "WebsiteRevision_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed granular Website Manager permissions and grant them to existing system administrators.
INSERT INTO "Permission" ("id", "key", "group", "label") VALUES
  ('website-read-permission', 'website.read', 'Website', 'View website settings and previews'),
  ('website-manage-permission', 'website.manage', 'Website', 'Manage website draft settings'),
  ('website-publish-permission', 'website.publish', 'Website', 'Publish website changes')
ON CONFLICT ("key") DO UPDATE SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role."name" IN ('Owner', 'Administrator')
  AND permission."key" IN ('website.read', 'website.manage', 'website.publish')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
