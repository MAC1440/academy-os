import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AcademyController } from './controllers/academy.controller';
import { BranchController } from './controllers/branch.controller';
import { MembershipController } from './controllers/membership.controller';
import { AcademyService } from './services/academy.service';
import { BranchService } from './services/branch.service';
import { TenantAccessService } from './services/tenant-access.service';
import { MembershipService } from './services/membership.service';

@Module({
  imports: [AuthModule],
  controllers: [AcademyController, BranchController, MembershipController],
  providers: [
    AcademyService,
    BranchService,
    MembershipService,
    TenantAccessService,
  ],
  exports: [
    AcademyService,
    BranchService,
    MembershipService,
    TenantAccessService,
  ],
})
export class OrganizationModule {}
