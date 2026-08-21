/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { TimetableMode, TimetableSlotType } from '@prisma/client';
import { TimetableService } from './timetable.service';

type Assignment = {
  id: string;
  academicOfferingId: string;
  timetableProfileId: string;
  timetableSlotId: string;
  subjectId: string;
  staffProfileId: string;
};

describe('TimetableService assignment patching', () => {
  function setup(conflictIds: string[] = []) {
    const assignments: Assignment[] = [1, 2, 3, 4].map((period) => ({
      id: `assignment-${period}`,
      academicOfferingId: 'class-a',
      timetableProfileId: 'profile-a',
      timetableSlotId: `slot-${period}`,
      subjectId: `subject-${period}`,
      staffProfileId: `teacher-${period}`,
    }));
    if (conflictIds.length)
      assignments.push({
        id: conflictIds[0]!,
        academicOfferingId: 'class-b',
        timetableProfileId: 'profile-a',
        timetableSlotId: 'other-slot',
        subjectId: 'other-subject',
        staffProfileId: 'replacement-teacher',
      });
    const tx = {
      timetableAssignment: {
        deleteMany: jest.fn().mockImplementation(({ where }) => {
          const ids = where.id?.in as string[] | undefined;
          const slots = where.timetableSlotId?.in as string[] | undefined;
          for (let index = assignments.length - 1; index >= 0; index -= 1) {
            const item = assignments[index]!;
            if (
              (ids?.includes(item.id) ?? false) ||
              (item.academicOfferingId === where.academicOfferingId &&
                item.timetableProfileId === where.timetableProfileId &&
                (slots?.includes(item.timetableSlotId) ?? false))
            )
              assignments.splice(index, 1);
          }
        }),
        upsert: jest.fn().mockImplementation(({ where, create, update }) => {
          const key = where.academicOfferingId_timetableSlotId;
          const existing = assignments.find(
            (item) =>
              item.academicOfferingId === key.academicOfferingId &&
              item.timetableSlotId === key.timetableSlotId,
          );
          if (existing) Object.assign(existing, update);
          else
            assignments.push({ id: `new-${key.timetableSlotId}`, ...create });
        }),
      },
    };
    const prisma = {
      timetableSlot: {
        findMany: jest.fn().mockImplementation(({ where }) =>
          (where.id.in as string[]).map((id) => ({
            id,
            weekday: null,
            startsAt: '08:00',
            endsAt: '08:40',
            slotType: TimetableSlotType.TEACHING,
          })),
        ),
      },
      organization: {
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: 'organization' }),
      },
      $transaction: jest.fn().mockImplementation((work) => work(tx)),
    };
    const audit = { record: jest.fn() };
    const service = new TimetableService(prisma as never, audit as never);
    jest.spyOn(service as never, 'offering').mockResolvedValue({
      id: 'class-a',
      branchId: 'branch-a',
    });
    jest
      .spyOn(service as never, 'ensureBranchAccess')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service, 'effectiveProfile')
      .mockResolvedValue({ id: 'profile-a' } as never);
    jest
      .spyOn(service as never, 'validateAssignmentReferences')
      .mockResolvedValue(undefined);
    jest
      .spyOn(service as never, 'findTeacherConflicts')
      .mockResolvedValue(conflictIds.map((assignmentId) => ({ assignmentId })));
    jest.spyOn(service, 'classTimetable').mockResolvedValue({} as never);
    return { service, assignments, tx };
  }

  it('updates one period and preserves every untouched assignment', async () => {
    const { service, assignments } = setup();
    await service.saveAssignments(
      'class-a',
      'profile-a',
      {
        assignments: [
          {
            timetableSlotId: 'slot-4',
            subjectId: 'urdu-updated',
            staffProfileId: 'teacher-updated',
          },
        ],
        clearedTimetableSlotIds: [],
      },
      'admin',
    );

    expect(assignments).toHaveLength(4);
    expect(
      assignments.find((item) => item.timetableSlotId === 'slot-1')?.subjectId,
    ).toBe('subject-1');
    expect(
      assignments.find((item) => item.timetableSlotId === 'slot-4'),
    ).toMatchObject({
      subjectId: 'urdu-updated',
      staffProfileId: 'teacher-updated',
    });
  });

  it('clears only the explicitly cleared period', async () => {
    const { service, assignments } = setup();
    await service.saveAssignments(
      'class-a',
      'profile-a',
      { assignments: [], clearedTimetableSlotIds: ['slot-2'] },
      'admin',
    );

    expect(assignments.map((item) => item.timetableSlotId)).toEqual([
      'slot-1',
      'slot-3',
      'slot-4',
    ]);
  });

  it('updates multiple periods and preserves everything else', async () => {
    const { service, assignments } = setup();
    await service.saveAssignments(
      'class-a',
      'profile-a',
      {
        assignments: [
          {
            timetableSlotId: 'slot-2',
            subjectId: 'new-2',
            staffProfileId: 'new-teacher-2',
          },
          {
            timetableSlotId: 'slot-4',
            subjectId: 'new-4',
            staffProfileId: 'new-teacher-4',
          },
        ],
        clearedTimetableSlotIds: [],
      },
      'admin',
    );

    expect(assignments).toHaveLength(4);
    expect(
      assignments.find((item) => item.timetableSlotId === 'slot-1')?.subjectId,
    ).toBe('subject-1');
    expect(
      assignments.find((item) => item.timetableSlotId === 'slot-3')?.subjectId,
    ).toBe('subject-3');
  });

  it('removes only confirmed teacher conflicts and keeps unrelated class periods', async () => {
    const { service, assignments } = setup(['conflicting-assignment']);
    await service.saveAssignments(
      'class-a',
      'profile-a',
      {
        assignments: [
          {
            timetableSlotId: 'slot-4',
            subjectId: 'new-4',
            staffProfileId: 'replacement-teacher',
          },
        ],
        clearedTimetableSlotIds: [],
        replaceTeacherConflicts: true,
      },
      'admin',
    );

    expect(
      assignments.some((item) => item.id === 'conflicting-assignment'),
    ).toBe(false);
    expect(
      assignments.filter((item) => item.academicOfferingId === 'class-a'),
    ).toHaveLength(4);
    expect(
      assignments.find((item) => item.timetableSlotId === 'slot-1')?.subjectId,
    ).toBe('subject-1');
  });
});

describe('TimetableService timing profile slot updates', () => {
  const service = new TimetableService({} as never, {} as never);

  it('accepts null period numbers for assembly and break entries', () => {
    expect(() =>
      service.preview({
        timetableMode: TimetableMode.SAME_DAILY,
        slots: [
          {
            slotType: TimetableSlotType.ASSEMBLY,
            periodNumber: null,
            startsAt: '07:30',
            endsAt: '07:40',
          },
          {
            slotType: TimetableSlotType.TEACHING,
            periodNumber: 1,
            startsAt: '07:40',
            endsAt: '08:20',
          },
          {
            slotType: TimetableSlotType.BREAK,
            periodNumber: null,
            startsAt: '08:20',
            endsAt: '08:40',
          },
        ],
      }),
    ).not.toThrow();
  });

  it('updates retained slot identities and removes only explicitly omitted slots', async () => {
    const tx = {
      timetableSlot: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'assembly' },
            { id: 'period-1' },
            { id: 'old-break' },
          ]),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await (
      service as unknown as {
        syncSlots: (
          client: typeof tx,
          profileId: string,
          slots: Array<Record<string, unknown>>,
        ) => Promise<void>;
      }
    ).syncSlots(tx, 'profile', [
      {
        id: 'assembly',
        slotType: TimetableSlotType.ASSEMBLY,
        periodNumber: null,
        startsAt: '07:30',
        endsAt: '07:45',
      },
      {
        id: 'period-1',
        slotType: TimetableSlotType.TEACHING,
        periodNumber: 1,
        startsAt: '07:45',
        endsAt: '08:25',
      },
    ]);

    expect(tx.timetableSlot.update).toHaveBeenCalledTimes(2);
    expect(tx.timetableSlot.create).not.toHaveBeenCalled();
    expect(tx.timetableSlot.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['old-break'] } },
    });
  });
});
