CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'LEARNER', 'STAFF');

CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL',
  "eventDate" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Announcement_organizationId_audience_eventDate_idx" ON "Announcement"("organizationId", "audience", "eventDate");
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
