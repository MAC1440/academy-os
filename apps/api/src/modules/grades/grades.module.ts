import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';
@Module({
  imports: [PrismaModule, AuthModule, AccessModule, AuditModule],
  controllers: [GradesController],
  providers: [GradesService],
})
export class GradesModule {}
