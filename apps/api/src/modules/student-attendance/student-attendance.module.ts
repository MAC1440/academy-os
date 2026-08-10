import { Module } from '@nestjs/common';
import { AccessModule } from '../access/access.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { StudentAttendanceController } from './student-attendance.controller';
import { StudentAttendanceService } from './student-attendance.service';
@Module({
  imports: [PrismaModule, AuthModule, AccessModule],
  controllers: [StudentAttendanceController],
  providers: [StudentAttendanceService],
})
export class StudentAttendanceModule {}
