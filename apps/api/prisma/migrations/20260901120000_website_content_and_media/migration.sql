CREATE TYPE "CalendarVisibility" AS ENUM ('INTERNAL', 'PUBLIC');
CREATE TYPE "WebsiteMediaCategory" AS ENUM ('BRANDING', 'HERO', 'FACULTY', 'FACILITIES', 'RESULTS', 'NEWS', 'GALLERY');

ALTER TABLE "AcademicCalendarDay"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "visibility" "CalendarVisibility" NOT NULL DEFAULT 'INTERNAL';

CREATE TABLE "WebsiteAnnouncement" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT NOT NULL, "published" BOOLEAN NOT NULL DEFAULT false,
  "pinned" BOOLEAN NOT NULL DEFAULT false, "publishAt" TIMESTAMP(3), "expireAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsiteAnnouncement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WebsiteNews" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "title" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "coverImageUrl" TEXT, "excerpt" TEXT NOT NULL, "body" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT false, "publishAt" TIMESTAMP(3), "seoTitle" TEXT,
  "seoDescription" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "WebsiteNews_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WebsiteResult" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "title" TEXT NOT NULL,
  "description" TEXT NOT NULL, "academicYear" TEXT NOT NULL, "highlights" JSONB NOT NULL,
  "imageUrl" TEXT, "published" BOOLEAN NOT NULL DEFAULT false, "publishAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsiteResult_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WebsiteMedia" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "providerFileId" TEXT NOT NULL,
  "name" TEXT NOT NULL, "url" TEXT NOT NULL, "width" INTEGER, "height" INTEGER,
  "mimeType" TEXT NOT NULL, "size" INTEGER NOT NULL, "category" "WebsiteMediaCategory" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "WebsiteMedia_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WebsiteGalleryAlbum" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "academicCalendarDayId" TEXT,
  "title" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT, "coverImageUrl" TEXT,
  "published" BOOLEAN NOT NULL DEFAULT false, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebsiteGalleryAlbum_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WebsiteGalleryImage" (
  "id" TEXT NOT NULL, "albumId" TEXT NOT NULL, "mediaId" TEXT NOT NULL, "caption" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "WebsiteGalleryImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebsiteAnnouncement_organizationId_published_publishAt_idx" ON "WebsiteAnnouncement"("organizationId", "published", "publishAt");
CREATE UNIQUE INDEX "WebsiteNews_organizationId_slug_key" ON "WebsiteNews"("organizationId", "slug");
CREATE INDEX "WebsiteNews_organizationId_published_publishAt_idx" ON "WebsiteNews"("organizationId", "published", "publishAt");
CREATE INDEX "WebsiteResult_organizationId_published_publishAt_idx" ON "WebsiteResult"("organizationId", "published", "publishAt");
CREATE UNIQUE INDEX "WebsiteMedia_providerFileId_key" ON "WebsiteMedia"("providerFileId");
CREATE INDEX "WebsiteMedia_organizationId_category_createdAt_idx" ON "WebsiteMedia"("organizationId", "category", "createdAt");
CREATE UNIQUE INDEX "WebsiteGalleryAlbum_organizationId_slug_key" ON "WebsiteGalleryAlbum"("organizationId", "slug");
CREATE INDEX "WebsiteGalleryAlbum_organizationId_published_sortOrder_idx" ON "WebsiteGalleryAlbum"("organizationId", "published", "sortOrder");
CREATE UNIQUE INDEX "WebsiteGalleryImage_albumId_mediaId_key" ON "WebsiteGalleryImage"("albumId", "mediaId");
CREATE INDEX "WebsiteGalleryImage_albumId_sortOrder_idx" ON "WebsiteGalleryImage"("albumId", "sortOrder");

ALTER TABLE "WebsiteAnnouncement" ADD CONSTRAINT "WebsiteAnnouncement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteNews" ADD CONSTRAINT "WebsiteNews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteResult" ADD CONSTRAINT "WebsiteResult_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteMedia" ADD CONSTRAINT "WebsiteMedia_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteGalleryAlbum" ADD CONSTRAINT "WebsiteGalleryAlbum_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteGalleryAlbum" ADD CONSTRAINT "WebsiteGalleryAlbum_academicCalendarDayId_fkey" FOREIGN KEY ("academicCalendarDayId") REFERENCES "AcademicCalendarDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WebsiteGalleryImage" ADD CONSTRAINT "WebsiteGalleryImage_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "WebsiteGalleryAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteGalleryImage" ADD CONSTRAINT "WebsiteGalleryImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "WebsiteMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
