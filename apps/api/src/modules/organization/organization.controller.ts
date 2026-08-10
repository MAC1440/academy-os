import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequireBranchAccess } from '../access/decorators/require-branch-access.decorator';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { BranchAccessGuard } from '../access/guards/branch-access.guard';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBranchDto } from './dto/create-branch.dto';
import {
  CreateBranchOperatingHourDto,
  UpdateBranchOperatingHourDto,
} from './dto/branch-operating-hours.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard, BranchAccessGuard)
@Controller()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('organization')
  @RequirePermissions('organization.read')
  async getOrganization() {
    return successResponse(
      'Organization retrieved',
      await this.organizationService.getOrganization(),
    );
  }

  @Patch('organization')
  @RequirePermissions('organization.manage')
  async updateOrganization(
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Organization updated',
      await this.organizationService.updateOrganization(dto, user.id),
    );
  }

  @Get('branches')
  @RequirePermissions('branches.read')
  async listBranches(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      'Branches retrieved',
      await this.organizationService.listBranches(user.id),
    );
  }

  @Post('branches')
  @RequirePermissions('branches.manage')
  async createBranch(
    @Body() dto: CreateBranchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Branch created',
      await this.organizationService.createBranch(dto, user.id),
    );
  }

  @Get('branches/:branchId')
  @RequirePermissions('branches.read')
  @RequireBranchAccess()
  async getBranch(@Param('branchId') branchId: string) {
    return successResponse(
      'Branch retrieved',
      await this.organizationService.getBranch(branchId),
    );
  }

  @Patch('branches/:branchId')
  @RequirePermissions('branches.manage')
  @RequireBranchAccess()
  async updateBranch(
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Branch updated',
      await this.organizationService.updateBranch(branchId, dto, user.id),
    );
  }

  @Get('branches/:branchId/operating-hours')
  @RequirePermissions('branches.read')
  @RequireBranchAccess()
  async listOperatingHours(@Param('branchId') branchId: string) {
    return successResponse(
      'Branch operating hours retrieved',
      await this.organizationService.listOperatingHours(branchId),
    );
  }

  @Post('branches/:branchId/operating-hours')
  @RequirePermissions('branches.manage')
  @RequireBranchAccess()
  async createOperatingHour(
    @Param('branchId') branchId: string,
    @Body() dto: CreateBranchOperatingHourDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Branch operating hours created',
      await this.organizationService.createOperatingHour(
        branchId,
        dto,
        user.id,
      ),
    );
  }

  @Patch('branches/:branchId/operating-hours/:operatingHourId')
  @RequirePermissions('branches.manage')
  @RequireBranchAccess()
  async updateOperatingHour(
    @Param('branchId') branchId: string,
    @Param('operatingHourId') operatingHourId: string,
    @Body() dto: UpdateBranchOperatingHourDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Branch operating hours updated',
      await this.organizationService.updateOperatingHour(
        branchId,
        operatingHourId,
        dto,
        user.id,
      ),
    );
  }
}
