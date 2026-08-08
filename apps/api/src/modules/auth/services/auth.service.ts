import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { jwtSecret, refreshSecret } from '../../../config/environment';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private issueTokens(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: jwtSecret,
        expiresIn: '15m',
      }),
      refreshToken: this.jwtService.sign(
        { ...payload, type: 'refresh' },
        { secret: refreshSecret, expiresIn: '7d' },
      ),
    };
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    const isValidPassword = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;

    if (!user || user.status !== 'ACTIVE' || !isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      ...this.issueTokens(user),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
      },
    };
  }

  async refresh(dto: RefreshDto) {
    let payload: { sub: string; email: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE' },
    });
    if (!user) {
      throw new UnauthorizedException('Account is not active');
    }

    // Rotation: every refresh call issues a brand new access + refresh pair.
    return {
      ...this.issueTokens(user),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
      },
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser)
      throw new ConflictException('Email is already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName ?? 'New',
        lastName: dto.lastName ?? 'User',
      },
    });
    return {
      message: 'User registered',
      user: { id: user.id, email: user.email },
    };
  }
}