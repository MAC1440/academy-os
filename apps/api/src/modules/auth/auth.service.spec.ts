import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './services/auth.service';

describe('AuthService', () => {
  it('logs in the seeded admin user', async () => {
    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as JwtService;
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-admin',
          email: 'admin@academyos.dev',
          passwordHash: await bcrypt.hash('Welcome123!', 10),
          firstName: 'School',
          lastName: 'Admin',
          status: 'ACTIVE',
        }),
      },
    } as unknown as PrismaService;

    const service = new AuthService(jwtService, prisma);

    const result = await service.login({
      email: 'admin@academyos.dev',
      password: 'Welcome123!',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('admin@academyos.dev');
  });
});
