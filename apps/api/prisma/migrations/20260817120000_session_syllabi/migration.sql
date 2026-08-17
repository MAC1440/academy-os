CREATE TABLE "SessionSyllabus" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionYear" TEXT NOT NULL,
    "classes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "SessionSyllabus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SessionSyllabus_organizationId_sessionYear_key"
ON "SessionSyllabus"("organizationId", "sessionYear");

CREATE INDEX "SessionSyllabus_organizationId_deletedAt_sessionYear_idx"
ON "SessionSyllabus"("organizationId", "deletedAt", "sessionYear");

ALTER TABLE "SessionSyllabus"
ADD CONSTRAINT "SessionSyllabus_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "Permission" ("id", "key", "group", "label")
VALUES
    ('permission-syllabus-read', 'syllabus.read', 'Syllabus', 'View session syllabi'),
    ('permission-syllabus-manage', 'syllabus.manage', 'Syllabus', 'Manage session syllabi')
ON CONFLICT ("key") DO UPDATE SET
    "group" = EXCLUDED."group",
    "label" = EXCLUDED."label";

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role."name" IN ('Owner', 'Administrator')
  AND permission."key" IN ('syllabus.read', 'syllabus.manage')
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN "Permission" permission
WHERE role."name" IN ('Teacher', 'Staff')
  AND permission."key" = 'syllabus.read'
ON CONFLICT DO NOTHING;
