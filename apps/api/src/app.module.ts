import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessModule } from './modules/access/access.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { AuditModule } from './modules/audit/audit.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { AuthModule } from './modules/auth/auth.module';
import { KioskModule } from './modules/kiosk/kiosk.module';
import { GradesModule } from './modules/grades/grades.module';
import { FinanceModule } from './modules/finance/finance.module';
import { NotesModule } from './modules/notes/notes.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { RolesModule } from './modules/roles/roles.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StaffModule } from './modules/staff/staff.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StudentAttendanceModule } from './modules/student-attendance/student-attendance.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AccessModule,
    AuditModule,
    CalendarModule,
    OrganizationModule,
    RolesModule,
    ReportsModule,
    StaffModule,
    SettingsModule,
    KioskModule,
    NotesModule,
    AcademicsModule,
    AdmissionsModule,
    StudentAttendanceModule,
    GradesModule,
    FinanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
