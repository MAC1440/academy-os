import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, AccountType, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { jwtSecret, refreshSecret } from '../../config/environment';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';

type PublicUser = Pick<
  User,
  | 'id'
  | 'accountType'
  | 'username'
  | 'contactNumber'
  | 'fullName'
  | 'email'
  | 'mustCompleteProfile'
>;

type TokenPayload = {
  sub: string;
  accountType: AccountType;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        status: AccountStatus.ACTIVE,
        OR: [{ username: identifier }, { contactNumber: identifier }],
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: refreshSecret ?? jwtSecret,
      });
      const user = await this.getActiveUser(payload.sub);
      return this.createSession(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async me(authenticatedUser: AuthenticatedUser): Promise<PublicUser> {
    return this.toPublicUser(await this.getActiveUser(authenticatedUser.id));
  }

  private async createSession(user: User) {
    const payload: TokenPayload = { sub: user.id, accountType: user.accountType };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret ?? jwtSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: this.toPublicUser(user),
    };
  }

  private async getActiveUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        status: AccountStatus.ACTIVE,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Account is unavailable');
    }

    return user;
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      accountType: user.accountType,
      username: user.username,
      contactNumber: user.contactNumber,
      fullName: user.fullName,
      email: user.email,
      mustCompleteProfile: user.mustCompleteProfile,
    };
  }
}
