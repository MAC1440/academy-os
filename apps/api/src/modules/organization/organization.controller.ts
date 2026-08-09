import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
import { CreateSessionDto, UpdateSessionDto } from './dto/create-session.dto';
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
    return successResponse('Organization retrieved', await this.organizationService.getOrganization());
  }

  @Patch('organization')
  @RequirePermissions('organization.manage')
  async updateOrganization(@Body() dto: UpdateOrganizationDto, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Organization updated', await this.organizationService.updateOrganization(dto, user.id));
  }

  @Get('branches')
  @RequirePermissions('branches.read')
  async listBranches(@CurrentUser() user: AuthenticatedUser) {
    return successResponse('Branches retrieved', await this.organizationService.listBranches(user.id));
  }

  @Post('branches')
  @RequirePermissions('branches.manage')
  async createBranch(@Body() dto: CreateBranchDto, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Branch created', await this.organizationService.createBranch(dto, user.id));
  }

  @Get('branches/:branchId')
  @RequirePermissions('branches.read')
  @RequireBranchAccess()
  async getBranch(@Param('branchId') branchId: string) {
    return successResponse('Branch retrieved', await this.organizationService.getBranch(branchId));
  }

  @Patch('branches/:branchId')
  @RequirePermissions('branches.manage')
  @RequireBranchAccess()
  async updateBranch(
    @Param('branchId') branchId: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse('Branch updated', await this.organizationService.updateBranch(branchId, dto, user.id));
  }

  @Get('branches/:branchId/sessions')
  @RequirePermissions('branches.read')
  @RequireBranchAccess()
  async listSessions(@Param('branchId') branchId: string) {
    return successResponse('Sessions retrieved', await this.organizationService.listSessions(branchId));
  }

  @Post('branches/:branchId/sessions')
  @RequirePermissions('branches.manage')
  @RequireBranchAccess()
  async createSession(
    @Param('branchId') branchId: string,
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse('Session created', await this.organizationService.createSession(branchId, dto, user.id));
  }

  @Patch('branches/:branchId/sessions/:sessionId')
  @RequirePermissions('branches.manage')
  @RequireBranchAccess()
  async updateSession(
    @Param('branchId') branchId: string,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Session updated',
      await this.organizationService.updateSession(branchId, sessionId, dto, user.id),
    );
  }
}
