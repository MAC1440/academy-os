import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtSecret } from '../../../config/environment';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isPlatformAdmin: true,
      },
    });
    if (!user) throw new UnauthorizedException('Account is not active');
    return user;
  }
}
