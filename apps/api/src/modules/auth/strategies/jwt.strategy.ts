import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AccountType } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtSecret } from '../../../config/environment';

type AccessTokenPayload = {
  sub: string;
  accountType: AccountType;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  validate(payload: AccessTokenPayload) {
    return {
      id: payload.sub,
      accountType: payload.accountType,
    };
  }
}
