/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { SyllabusService } from './syllabus.service';

const classes = [
  {
    className: '9th',
    groups: [
      {
        name: 'First Term',
        subjects: [
          { subjectName: 'English', content: '**Chapters 1–4**' },
          { subjectName: 'Activity Work', content: 'Portfolio work' },
        ],
      },
      { name: 'Final Term', subjects: [] },
    ],
  },
  { className: '10th', groups: [] },
];

describe('SyllabusService', () => {
  function setup() {
    const records: Array<Record<string, unknown> & { id: string }> = [];
    let sequence = 0;
    const sessionSyllabus = {
      create: jest.fn().mockImplementation(({ data }) => {
        if (records.some((record) => record.sessionYear === data.sessionYear)) {
          const error = new Error('Unique constraint') as Error & {
            code: string;
          };
          error.code = 'P2002';
          throw error;
        }
        const now = new Date(
          `2026-08-${String(++sequence).padStart(2, '0')}T00:00:00.000Z`,
        );
        const record = {
          id: `syllabus-${sequence}`,
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        records.push(record);
        return record;
      }),
      findMany: jest
        .fn()
        .mockImplementation(() =>
          records
            .filter((record) => record.deletedAt == null)
            .sort((a, b) =>
              String(b.sessionYear).localeCompare(String(a.sessionYear)),
            ),
        ),
      findFirst: jest
        .fn()
        .mockImplementation(({ where }) =>
          records.find(
            (record) =>
              record.id === where.id &&
              record.organizationId === where.organizationId &&
              record.deletedAt == null,
          ),
        ),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const record = records.find((item) => item.id === where.id)!;
        Object.assign(record, data);
        return record;
      }),
    };
    const tx = {
      sessionSyllabus: {
        updateMany: jest.fn().mockImplementation(({ where, data }) => {
          const record = records.find(
            (item) =>
              item.id === where.id &&
              String(item.updatedAt) === String(where.updatedAt) &&
              item.deletedAt == null,
          );
          if (!record) return { count: 0 };
          Object.assign(record, data, {
            updatedAt: new Date('2026-09-01T00:00:00.000Z'),
          });
          return { count: 1 };
        }),
        findUniqueOrThrow: jest
          .fn()
          .mockImplementation(({ where }) =>
            records.find((record) => record.id === where.id),
          ),
      },
    };
    const prisma = {
      organization: {
        findFirst: jest.fn().mockResolvedValue({ id: 'organization' }),
      },
      sessionSyllabus,
      $transaction: jest.fn().mockImplementation((work) => work(tx)),
    };
    const audit = { record: jest.fn() };
    return {
      service: new SyllabusService(prisma as never, audit as never),
      records,
      audit,
      tx,
    };
  }

  it('creates a complete session document with multiple classes, groups, and rich text', async () => {
    const { service, records, audit } = setup();
    const created = await service.create(
      { sessionYear: '2026-27', classes },
      'admin',
    );
    expect(created.sessionYear).toBe('2026-27');
    expect(records[0]?.classes).toEqual(classes);
    expect(JSON.stringify(records[0]?.classes)).toContain('**Chapters 1–4**');
    expect(audit.record).toHaveBeenCalled();
  });

  it('rejects a duplicate session while allowing multiple historical sessions', async () => {
    const { service } = setup();
    await service.create({ sessionYear: '2026-27', classes: [] }, 'admin');
    await service.create({ sessionYear: '2027-28', classes: [] }, 'admin');
    await expect(
      service.create({ sessionYear: '2026-27', classes: [] }, 'admin'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(service.list()).resolves.toHaveLength(2);
  });

  it('rejects duplicate class names inside one session', async () => {
    const { service } = setup();
    await expect(
      service.create(
        {
          sessionYear: '2026-27',
          classes: [
            { className: '9th', groups: [] },
            { className: ' 9TH ', groups: [] },
          ],
        },
        'admin',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects names that contain only whitespace after normalization', async () => {
    const { service } = setup();
    await expect(
      service.create(
        {
          sessionYear: '2026-27',
          classes: [
            {
              className: '9th',
              groups: [
                {
                  name: 'First Term',
                  subjects: [{ subjectName: '  ', content: '' }],
                },
              ],
            },
          ],
        },
        'admin',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates a complete valid document and rejects stale editor state', async () => {
    const { service } = setup();
    const created = await service.create(
      { sessionYear: '2026-27', classes },
      'admin',
    );
    const originalVersion = created.updatedAt.toISOString();
    const changed = structuredClone(classes);
    changed[0]!.groups[0]!.subjects[0]!.content =
      'Updated without losing other subjects';
    const updated = await service.update(
      created.id,
      { expectedUpdatedAt: originalVersion, classes: changed },
      'admin',
    );
    expect(updated.classes).toEqual(changed);
    expect(JSON.stringify(updated.classes)).toContain('Activity Work');
    await expect(
      service.update(
        created.id,
        {
          expectedUpdatedAt: originalVersion,
          classes: changed,
        },
        'admin',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists syllabi without consulting campus assignments', async () => {
    const { service } = setup();
    await service.create({ sessionYear: '2026-27', classes: [] }, 'admin');
    await expect(service.list()).resolves.toHaveLength(1);
  });
});
