/* eslint-disable @typescript-eslint/unbound-method */
import { ForbiddenException } from '@nestjs/common';
import { AccountType } from '@prisma/client';
import { PERMISSIONS_KEY } from '../access/decorators/require-permissions.decorator';
import { SyllabusController } from './syllabus.controller';

describe('SyllabusController authorization', () => {
  const service = {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
  const controller = new SyllabusController(service as never);
  const staff = { id: 'staff-user', accountType: AccountType.STAFF };

  it('allows the staff read flow and requires school-wide read permission', async () => {
    await expect(controller.list()).resolves.toMatchObject({
      success: true,
      data: [],
    });
    expect(
      Reflect.getMetadata(PERMISSIONS_KEY, SyllabusController.prototype.list),
    ).toEqual(['syllabus.read']);
  });

  it('blocks staff mutations even if a role is accidentally over-permissioned', async () => {
    await expect(
      controller.create({ sessionYear: '2026-27', classes: [] }, staff),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      controller.update(
        'syllabus',
        { expectedUpdatedAt: new Date().toISOString(), classes: [] },
        staff,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.archive('syllabus', staff)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
