import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AcademicsController } from './academics.controller';
import { AcademicsService } from './academics.service';

@Module({ imports: [PrismaModule, AuthModule, AccessModule, AuditModule], controllers: [AcademicsController], providers: [AcademicsService] })
export class AcademicsModule {}
