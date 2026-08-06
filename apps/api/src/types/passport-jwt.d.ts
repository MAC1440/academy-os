declare module 'passport-jwt' {
  import type { Request } from 'express';

  export type JwtFromRequestFunction = (request: Request) => string | null;

  export interface StrategyOptions {
    jwtFromRequest: JwtFromRequestFunction;
    secretOrKey: string;
    ignoreExpiration?: boolean;
  }

  export class Strategy {
    constructor(options: StrategyOptions);
  }

  export const ExtractJwt: {
    fromAuthHeaderAsBearerToken(): JwtFromRequestFunction;
  };
}
