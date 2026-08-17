/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { UnauthorizedException } from '@nestjs/common';
import { AccountStatus, AccountType, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService kiosk PIN self-service', () => {
  async function setup() {
    const existing: User = {
      id: 'staff-user',
      accountType: AccountType.STAFF,
      username: null,
      contactNumber: '03001234567',
      fullName: 'Staff Member',
      email: null,
      passwordHash: await bcrypt.hash('Welcome123!', 4),
      pinHash: await bcrypt.hash('1111', 4),
      temporaryPasswordEncrypted: null,
      temporaryPinEncrypted: 'temporary-pin',
      mustCompleteProfile: false,
      status: AccountStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(existing),
        update: jest
          .fn()
          .mockImplementation(({ data }) => ({ ...existing, ...data })),
      },
    };
    return {
      service: new AuthService(prisma as never, {} as never),
      prisma,
    };
  }

  it('lets authenticated staff change their PIN after confirming their password', async () => {
    const { service, prisma } = await setup();
    await service.updateProfile(
      { id: 'staff-user', accountType: AccountType.STAFF },
      { currentPassword: 'Welcome123!', newPin: '6601' },
    );
    const data = prisma.user.update.mock.calls[0]![0].data as {
      pinHash: string;
      temporaryPinEncrypted: null;
    };
    await expect(bcrypt.compare('6601', data.pinHash)).resolves.toBe(true);
    expect(data.temporaryPinEncrypted).toBeNull();
  });

  it('rejects a PIN change when the current password is wrong', async () => {
    const { service, prisma } = await setup();
    await expect(
      service.updateProfile(
        { id: 'staff-user', accountType: AccountType.STAFF },
        { currentPassword: 'wrong-password', newPin: '6601' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
