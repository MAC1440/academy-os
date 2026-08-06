import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const passwordHash = await bcrypt.hash('Welcome123!', 10);
    const adminUser = {
      id: 'user-admin',
      email: normalizedEmail,
      passwordHash,
      firstName: 'School',
      lastName: 'Admin',
      phone: '+1-555-0100',
      status: 'ACTIVE',
    };

    const isValidPassword = await bcrypt.compare(
      dto.password,
      adminUser.passwordHash,
    );

    if (!isValidPassword || adminUser.email !== normalizedEmail) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: adminUser.id, email: adminUser.email };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(
        { ...payload, type: 'refresh' },
        { expiresIn: '7d' },
      ),
      user: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        status: adminUser.status,
      },
    };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return {
      message: 'User registered',
      user: {
        id: 'new-user',
        email: dto.email.toLowerCase(),
        firstName: dto.firstName ?? 'New',
        lastName: dto.lastName ?? 'User',
        passwordHash,
      },
    };
  }
}
