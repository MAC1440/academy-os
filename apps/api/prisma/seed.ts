import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  ['organization.read', 'Organization', 'View organization'],
  ['organization.manage', 'Organization', 'Manage organization and branches'],
  ['people.read', 'People', 'View teachers and staff'],
  ['people.manage', 'People', 'Manage teachers and staff'],
  ['academics.read', 'Academics', 'View academic structure'],
  ['academics.manage', 'Academics', 'Manage academic structure'],
  ['attendance.read', 'Attendance', 'View attendance'],
  ['attendance.manage', 'Attendance', 'Manage attendance'],
  ['reports.read', 'Reports', 'View reports'],
] as const;

const systemRoles: Record<string, string[]> = {
  Owner: permissions.map(([key]) => key),
  Administrator: permissions.map(([key]) => key),
  Manager: ['organization.read', 'people.read', 'people.manage', 'academics.read', 'academics.manage', 'attendance.read', 'attendance.manage', 'reports.read'],
  Teacher: ['people.read', 'academics.read', 'attendance.read', 'attendance.manage'],
  Receptionist: ['people.read', 'attendance.read'],
  Accountant: ['reports.read'],
  Student: [],
  Parent: [],
};

async function main() {
  const passwordHash = await bcrypt.hash('Welcome123!', 12);
  await prisma.user.upsert({
    where: { email: 'superadmin@academyos.dev' },
    update: { isPlatformAdmin: true, status: 'ACTIVE', deletedAt: null },
    create: {
      email: 'superadmin@academyos.dev',
      passwordHash,
      firstName: 'Platform',
      lastName: 'Administrator',
      isPlatformAdmin: true,
    },
  });

  for (const [key, group, label] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { group, label },
      create: { key, group, label },
    });
  }

  for (const [name, permissionKeys] of Object.entries(systemRoles)) {
    let role = await prisma.role.findFirst({ where: { academyId: null, name } });
    if (!role) role = await prisma.role.create({ data: { name, isSystem: true } });
    const records = await prisma.permission.findMany({ where: { key: { in: permissionKeys } }, select: { id: true } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (records.length) await prisma.rolePermission.createMany({ data: records.map((permission) => ({ roleId: role!.id, permissionId: permission.id })) });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
