import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AcademyController } from './controllers/academy.controller';
import { BranchController } from './controllers/branch.controller';
import { AcademyService } from './services/academy.service';
import { BranchService } from './services/branch.service';
import { TenantAccessService } from './services/tenant-access.service';

@Module({
  imports: [AuthModule],
  controllers: [AcademyController, BranchController],
  providers: [AcademyService, BranchService, TenantAccessService],
  exports: [AcademyService, BranchService, TenantAccessService],
})
export class OrganizationModule {}
