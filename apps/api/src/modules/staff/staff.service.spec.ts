/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { StaffType } from '@prisma/client';
import { StaffService } from './staff.service';

describe('StaffService campus assignment updates', () => {
  it('adds and removes target campuses while preserving unrelated assignments', async () => {
    const assignments = [
      { userId: 'staff-user', roleId: 'teacher-role', branchId: 'campus-a' },
      { userId: 'staff-user', roleId: 'teacher-role', branchId: 'campus-b' },
      { userId: 'staff-user', roleId: 'global-role', branchId: null },
      { userId: 'other-user', roleId: 'teacher-role', branchId: 'campus-a' },
    ];
    const tx = {
      staffProfile: {
        update: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'staff-profile',
          user: { roleAssignments: [] },
        }),
      },
      roleAssignment: {
        deleteMany: jest.fn().mockImplementation(({ where }) => {
          for (let index = assignments.length - 1; index >= 0; index -= 1) {
            const item = assignments[index]!;
            if (
              item.userId === where.userId &&
              item.branchId !== null &&
              !where.NOT.branchId.in.includes(item.branchId)
            )
              assignments.splice(index, 1);
          }
        }),
        createMany: jest.fn().mockImplementation(({ data }) => {
          for (const item of data as typeof assignments) {
            if (
              !assignments.some(
                (existing) =>
                  existing.userId === item.userId &&
                  existing.roleId === item.roleId &&
                  existing.branchId === item.branchId,
              )
            )
              assignments.push(item);
          }
        }),
      },
    };
    const prisma = {
      staffProfile: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'staff-profile',
          userId: 'staff-user',
          staffType: StaffType.TEACHER,
        }),
      },
      branch: { count: jest.fn().mockResolvedValue(2) },
      roleAssignment: {
        findMany: jest.fn().mockResolvedValue([
          { roleId: 'teacher-role', branchId: 'campus-a' },
          { roleId: 'teacher-role', branchId: 'campus-b' },
        ]),
      },
      organization: {
        findFirst: jest.fn().mockResolvedValue({ id: 'organization' }),
      },
      $transaction: jest.fn().mockImplementation((work) => work(tx)),
    };
    const audit = { record: jest.fn() };
    const service = new StaffService(prisma as never, audit as never);

    await service.updateStaff(
      'staff-profile',
      { branchIds: ['campus-b', 'campus-c'] },
      'admin-user',
    );

    expect(assignments).toEqual(
      expect.arrayContaining([
        { userId: 'staff-user', roleId: 'teacher-role', branchId: 'campus-b' },
        { userId: 'staff-user', roleId: 'teacher-role', branchId: 'campus-c' },
        { userId: 'staff-user', roleId: 'global-role', branchId: null },
        { userId: 'other-user', roleId: 'teacher-role', branchId: 'campus-a' },
      ]),
    );
    expect(assignments).not.toContainEqual({
      userId: 'staff-user',
      roleId: 'teacher-role',
      branchId: 'campus-a',
    });
    expect(tx.roleAssignment.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'staff-user',
        branchId: { not: null },
        NOT: { branchId: { in: ['campus-b', 'campus-c'] } },
      },
    });
  });
});
