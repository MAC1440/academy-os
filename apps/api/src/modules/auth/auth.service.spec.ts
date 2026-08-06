import { JwtService } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';

describe('AuthService', () => {
  it('logs in the seeded admin user', async () => {
    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as unknown as JwtService;

    const service = new AuthService(jwtService);

    const result = await service.login({
      email: 'admin@academyos.dev',
      password: 'Welcome123!',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('admin@academyos.dev');
  });
});
