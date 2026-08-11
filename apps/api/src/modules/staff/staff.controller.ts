import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@ApiTags('Staff')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  @RequirePermissions('staff.read')
  async listStaff(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      'Staff retrieved',
      await this.staffService.listStaff(user.id),
    );
  }

  @Get(':staffId')
  @RequirePermissions('staff.read')
  async getStaff(
    @Param('staffId') staffId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Staff member retrieved',
      await this.staffService.getStaff(staffId, user.id),
    );
  }

  @Get(':staffId/temporary-credentials')
  @RequirePermissions('staff.manage')
  async temporaryCredentials(@Param('staffId') staffId: string) {
    return successResponse(
      'Active temporary staff credentials retrieved',
      await this.staffService.temporaryCredentials(staffId),
    );
  }

  @Post()
  @RequirePermissions('staff.manage')
  async createStaff(
    @Body() dto: CreateStaffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Staff member created. Temporary credentials remain available to administrators until changed.',
      await this.staffService.createStaff(dto, user.id),
    );
  }

  @Patch(':staffId')
  @RequirePermissions('staff.manage')
  async updateStaff(
    @Param('staffId') staffId: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Staff member updated',
      await this.staffService.updateStaff(staffId, dto, user.id),
    );
  }

  @Delete(':staffId')
  @RequirePermissions('staff.manage')
  async deleteStaff(
    @Param('staffId') staffId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Staff member removed',
      await this.staffService.deleteStaff(staffId, user.id),
    );
  }

  @Post(':staffId/reset-pin')
  @RequirePermissions('staff.manage')
  async resetPin(
    @Param('staffId') staffId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'PIN reset. The temporary PIN remains available to administrators until changed.',
      await this.staffService.resetPin(staffId, user.id),
    );
  }

  @Post(':staffId/reset-password')
  @RequirePermissions('staff.manage')
  async resetPassword(
    @Param('staffId') staffId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Password reset. The temporary password remains available to administrators until changed.',
      await this.staffService.resetPassword(staffId, user.id),
    );
  }
}
