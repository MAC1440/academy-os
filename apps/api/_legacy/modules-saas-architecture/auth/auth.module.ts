import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtSecret } from '../../config/environment';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PlatformAdminGuard, PermissionsGuard],
  exports: [AuthService, PassportModule, JwtModule, PlatformAdminGuard, PermissionsGuard],
})
export class AuthModule {}
