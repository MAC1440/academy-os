import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccessService } from './access.service';
import { BranchAccessGuard } from './guards/branch-access.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [PrismaModule],
  providers: [AccessService, PermissionsGuard, BranchAccessGuard],
  exports: [AccessService, PermissionsGuard, BranchAccessGuard],
})
export class AccessModule {}
