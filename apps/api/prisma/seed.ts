import * as bcrypt from 'bcryptjs';
import { AccountType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  ['organization.read', 'Organization', 'View organization settings'],
  ['organization.manage', 'Organization', 'Manage organization settings'],
  ['branches.read', 'Branches', 'View branches and sessions'],
  ['branches.manage', 'Branches', 'Manage branches and sessions'],
  ['staff.read', 'Staff', 'View staff'],
  ['staff.manage', 'Staff', 'Manage staff'],
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

  const administratorRole = await prisma.role.upsert({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'Administrator',
      },
    },
    update: { isSystem: true },
    create: {
      organizationId: organization.id,
      name: 'Administrator',
      isSystem: true,
    },
  });

  const permissionRecords = await prisma.permission.findMany({
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({
      where: { roleId: administratorRole.id },
    }),
    prisma.roleAssignment.deleteMany({
      where: { userId: administrator.id, roleId: administratorRole.id },
    }),
  ]);

  await prisma.rolePermission.createMany({
    data: permissionRecords.map((permission) => ({
      roleId: administratorRole.id,
      permissionId: permission.id,
    })),
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
