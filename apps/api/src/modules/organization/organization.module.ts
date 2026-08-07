import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AcademyController } from './controllers/academy.controller';
import { BranchController } from './controllers/branch.controller';
import { MembershipController } from './controllers/membership.controller';
import { AcademicSettingsController } from './controllers/academic-settings.controller';
import { SchoolClassController } from './controllers/school-class.controller';
import { AcademicCalendarController } from './controllers/academic-calendar.controller';
import { AcademyService } from './services/academy.service';
import { BranchService } from './services/branch.service';
import { TenantAccessService } from './services/tenant-access.service';
import { MembershipService } from './services/membership.service';
import { AcademicSettingsService } from './services/academic-settings.service';
import { SchoolClassService } from './services/school-class.service';
import { AcademicCalendarService } from './services/academic-calendar.service';

@Module({
  imports: [AuthModule],
  controllers: [
    AcademyController,
    BranchController,
    MembershipController,
    AcademicSettingsController,
    SchoolClassController,
    AcademicCalendarController,
  ],
  providers: [
    AcademyService,
    BranchService,
    MembershipService,
    AcademicSettingsService,
    SchoolClassService,
    AcademicCalendarService,
    TenantAccessService,
  ],
  exports: [
    AcademyService,
    BranchService,
    MembershipService,
    AcademicSettingsService,
    SchoolClassService,
    AcademicCalendarService,
    TenantAccessService,
  ],
})
export class OrganizationModule {}
