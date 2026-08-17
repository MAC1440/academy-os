/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { NotesService } from './notes.service';

describe('NotesService large content persistence', () => {
  it('passes valid large note content to Prisma without truncating it', async () => {
    const content = 'chapter content '.repeat(120_000).trim();
    const prisma = {
      organization: {
        findFirst: jest.fn().mockResolvedValue({ id: 'organization' }),
      },
      sharedNote: {
        create: jest
          .fn()
          .mockImplementation(({ data }) => ({ id: 'note', ...data })),
      },
    };
    const audit = { record: jest.fn() };
    const service = new NotesService(prisma as never, audit as never);

    const note = await service.createNote(
      { title: 'Imported book', content },
      'author',
    );

    expect(note.content).toBe(content);
    expect(prisma.sharedNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ content }),
      }),
    );
  });

  it('returns a single active note with its author details', async () => {
    const persisted = {
      id: 'note',
      title: 'Fractions',
      content: '**Read me**',
      author: { id: 'author', fullName: 'Teacher One' },
      lastEditedBy: { id: 'editor', fullName: 'Teacher Two' },
    };
    const prisma = {
      organization: {
        findFirst: jest.fn().mockResolvedValue({ id: 'organization' }),
      },
      sharedNote: {
        findFirst: jest.fn().mockResolvedValue(persisted),
      },
    };
    const service = new NotesService(
      prisma as never,
      { record: jest.fn() } as never,
    );

    await expect(service.getNote('note')).resolves.toEqual(persisted);
    expect(prisma.sharedNote.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'note',
          organizationId: 'organization',
          deletedAt: null,
        },
      }),
    );
  });
});
