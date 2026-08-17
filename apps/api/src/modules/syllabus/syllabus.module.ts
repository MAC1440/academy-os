import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { SyllabusController } from './syllabus.controller';
import { SyllabusService } from './syllabus.service';

@Module({
  imports: [PrismaModule, AuthModule, AccessModule, AuditModule],
  controllers: [SyllabusController],
  providers: [SyllabusService],
})
export class SyllabusModule {}
