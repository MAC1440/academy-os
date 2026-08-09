import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions')
  @RequirePermissions('roles.read')
  async listPermissions() {
    return successResponse('Permissions retrieved', await this.rolesService.listPermissions());
  }

  @Get('roles')
  @RequirePermissions('roles.read')
  async listRoles() {
    return successResponse('Roles retrieved', await this.rolesService.listRoles());
  }

  @Post('roles')
  @RequirePermissions('roles.manage')
  async createRole(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Role created', await this.rolesService.createRole(dto, user.id));
  }

  @Patch('roles/:roleId')
  @RequirePermissions('roles.manage')
  async updateRole(
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse('Role updated', await this.rolesService.updateRole(roleId, dto, user.id));
  }

  @Post('role-assignments')
  @RequirePermissions('roles.manage')
  async assignRole(@Body() dto: AssignRoleDto, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Role assigned', await this.rolesService.assignRole(dto, user.id));
  }

  @Delete('role-assignments/:assignmentId')
  @RequirePermissions('roles.manage')
  async removeAssignment(@Param('assignmentId') assignmentId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.rolesService.removeAssignment(assignmentId, user.id);
    return successResponse('Role assignment removed', { id: assignmentId });
  }
}
