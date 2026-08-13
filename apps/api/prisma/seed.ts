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
    // A seed can be intentionally rerun to fill reference data. Never overwrite
    // a live administrator's password or profile in that case.
    update: {},
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
        data: permissionRecords.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
      });
    }
  }

  const administratorRole = await prisma.role.findUniqueOrThrow({
    where: {
      organizationId_name: {
        organizationId: organization.id,
        name: 'Administrator',
      },
    },
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

  const classNames = [
    'Nursery',
    'Prep 1',
    'Prep 2',
    ...Array.from({ length: 10 }, (_, index) => `Class ${index + 1}`),
    'HSSC-I',
    'HSSC-II',
  ];
  const classes = await Promise.all(
    classNames.map((name, sortOrder) =>
      prisma.schoolClass.upsert({
        where: {
          organizationId_name: { organizationId: organization.id, name },
        },
        update: { sortOrder },
        create: { organizationId: organization.id, name, sortOrder },
      }),
    ),
  );
  const byClass = new Map(classes.map((item) => [item.name, item]));
  const subjectNames = [
    'English',
    'Urdu',
    'Mathematics',
    'General Mathematics',
    'General Science',
    'Social Studies',
    'Computer',
    'Computer Science',
    'Islamiyat',
    'Ethics',
    'Pakistan Studies',
    'Physics',
    'Chemistry',
    'Biology',
    'Statistics',
    'Economics',
  ];
  const subjects = await Promise.all(
    subjectNames.map((name) =>
      prisma.subject.upsert({
        where: {
          organizationId_name: { organizationId: organization.id, name },
        },
        update: {},
        create: { organizationId: organization.id, name },
      }),
    ),
  );
  const bySubject = new Map(subjects.map((item) => [item.name, item]));
  const groupDefinitions = [
    ['Science', ['Class 9', 'Class 10']],
    ['Computer', ['Class 9', 'Class 10']],
    ['Arts', ['Class 9', 'Class 10']],
    ['Pre-Medical', ['HSSC-I', 'HSSC-II']],
    ['Pre-Engineering', ['HSSC-I', 'HSSC-II']],
    ['ICS', ['HSSC-I', 'HSSC-II']],
    ['Arts / General Science / Statistics / Economics', ['HSSC-I', 'HSSC-II']],
  ] as const;
  const groups = new Map<string, { id: string }>();
  for (const [name, targetClasses] of groupDefinitions) {
    const group = await prisma.academicGroup.upsert({
      where: { organizationId_name: { organizationId: organization.id, name } },
      update: {},
      create: {
        organizationId: organization.id,
        name,
        schoolClasses: {
          create: targetClasses.map((className) => ({
            schoolClassId: byClass.get(className)!.id,
          })),
        },
      },
    });
    groups.set(name, group);
  }
  await prisma.schoolClassCurriculumSubject.deleteMany({
    where: { schoolClass: { organizationId: organization.id } },
  });
  const addTemplate = async (
    className: string,
    names: string[],
    groupName?: string,
  ) =>
    prisma.schoolClassCurriculumSubject.createMany({
      data: names.map((name) => ({
        schoolClassId: byClass.get(className)!.id,
        academicGroupId: groupName ? groups.get(groupName)!.id : null,
        subjectId: bySubject.get(name)!.id,
      })),
    });
  for (const className of classNames.slice(0, 11))
    await addTemplate(className, [
      'English',
      'Urdu',
      'Mathematics',
      'General Science',
      'Islamiyat',
      'Social Studies',
      'Computer',
    ]);
  for (const className of ['Class 9', 'Class 10']) {
    await addTemplate(className, [
      'English',
      'Urdu',
      'Islamiyat',
      'Pakistan Studies',
    ]);
    await addTemplate(
      className,
      ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
      'Science',
    );
    await addTemplate(
      className,
      ['Mathematics', 'Physics', 'Chemistry', 'Computer Science'],
      'Computer',
    );
    await addTemplate(
      className,
      ['General Mathematics', 'General Science', 'Economics'],
      'Arts',
    );
  }
  for (const className of ['HSSC-I', 'HSSC-II']) {
    await addTemplate(className, [
      'English',
      'Urdu',
      'Islamiyat',
      'Pakistan Studies',
    ]);
    await addTemplate(
      className,
      ['Physics', 'Chemistry', 'Biology'],
      'Pre-Medical',
    );
    await addTemplate(
      className,
      ['Physics', 'Chemistry', 'Mathematics'],
      'Pre-Engineering',
    );
    await addTemplate(
      className,
      ['Physics', 'Mathematics', 'Computer Science'],
      'ICS',
    );
    await addTemplate(
      className,
      ['General Science', 'Statistics', 'Economics'],
      'Arts / General Science / Statistics / Economics',
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    await prisma.$disconnect();
    throw error;
  });
