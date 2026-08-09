import * as bcrypt from 'bcryptjs';
import { AccountType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  ['organization.read', 'Organization', 'View organization settings'],
  ['organization.manage', 'Organization', 'Manage organization settings'],
  ['branches.read', 'Branches', 'View branches and operating hours'],
  ['branches.manage', 'Branches', 'Manage branches and operating hours'],
  ['academics.read', 'Academics', 'View academic setup and offerings'],
  ['academics.manage', 'Academics', 'Manage academic setup and offerings'],
  ['roles.read', 'Roles', 'View roles and permissions'],
  ['roles.manage', 'Roles', 'Manage roles and assignments'],
  ['staff.read', 'Staff', 'View staff'],
  ['staff.manage', 'Staff', 'Manage staff'],
  ['attendance.read', 'Attendance', 'View attendance'],
  ['attendance.manage', 'Attendance', 'Manage student attendance'],
  ['admissions.read', 'Admissions', 'View admissions'],
  ['admissions.manage', 'Admissions', 'Manage admissions'],
  ['kiosk.manage', 'Kiosk', 'Manage teacher attendance kiosk'],
  ['notes.read', 'Notes', 'View shared notes'],
  ['notes.manage', 'Notes', 'Manage shared notes'],
  ['grades.read', 'Grades', 'View grades'],
  ['grades.manage', 'Grades', 'Manage grades'],
  ['finance.read', 'Finance', 'View finance records'],
  ['finance.manage', 'Finance', 'Manage finance records'],
  ['reports.read', 'Reports', 'View and export reports'],
] as const;

const systemRoles: Record<string, string[]> = {
  Owner: permissions.map(([key]) => key),
  Administrator: permissions.map(([key]) => key),
  Teacher: [
    'branches.read',
    'academics.read',
    'attendance.read',
    'attendance.manage',
    'notes.read',
    'notes.manage',
    'grades.read',
    'grades.manage',
  ],
  Staff: ['branches.read', 'notes.read'],
};

async function main() {
  const organization =
    (await prisma.organization.findFirst()) ??
    (await prisma.organization.create({
      data: {
        name: 'Your Organization',
      },
    }));

  const passwordHash = await bcrypt.hash('Welcome123!', 12);
  const administrator = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      accountType: AccountType.ADMIN,
      fullName: 'Default Administrator',
      passwordHash,
      status: 'ACTIVE',
      deletedAt: null,
      mustCompleteProfile: true,
    },
    create: {
      accountType: AccountType.ADMIN,
      username: 'admin',
      fullName: 'Default Administrator',
      passwordHash,
      mustCompleteProfile: true,
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
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: organization.id, name } },
      update: { isSystem: true },
      create: { organizationId: organization.id, name, isSystem: true },
    });
    const permissionRecords = await prisma.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permissionRecords.length) {
      await prisma.rolePermission.createMany({
        data: permissionRecords.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
      });
    }
  }

  const administratorRole = await prisma.role.findUniqueOrThrow({
    where: { organizationId_name: { organizationId: organization.id, name: 'Administrator' } },
  });

  await prisma.roleAssignment.deleteMany({
    where: { userId: administrator.id, roleId: administratorRole.id },
  });

  await prisma.roleAssignment.create({
    data: {
      userId: administrator.id,
      roleId: administratorRole.id,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
