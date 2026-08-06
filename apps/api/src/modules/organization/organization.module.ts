import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AcademyController } from './controllers/academy.controller';
import { BranchController } from './controllers/branch.controller';
import { AcademyService } from './services/academy.service';
import { BranchService } from './services/branch.service';

@Module({
  imports: [AuthModule],
  controllers: [AcademyController, BranchController],
  providers: [AcademyService, BranchService],
  exports: [AcademyService, BranchService],
})
export class OrganizationModule {}
