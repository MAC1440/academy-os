CREATE TABLE "TeacherPersonalNote" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "reminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TeacherPersonalNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeacherPersonalNote_ownerUserId_deletedAt_updatedAt_idx" ON "TeacherPersonalNote"("ownerUserId", "deletedAt", "updatedAt");
CREATE INDEX "TeacherPersonalNote_ownerUserId_reminderAt_idx" ON "TeacherPersonalNote"("ownerUserId", "reminderAt");

ALTER TABLE "TeacherPersonalNote" ADD CONSTRAINT "TeacherPersonalNote_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
