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
import { KioskPinDto } from './dto/kiosk-pin.dto';
import { OverrideStaffAttendanceDto } from './dto/override-staff-attendance.dto';
import { UpdateKioskSettingsDto } from './dto/update-kiosk-settings.dto';
import { KioskService } from './kiosk.service';

@ApiTags('Attendance Kiosk')
@Controller()
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  @Get('kiosk/branches/:branchId/staff')
  async listBranchStaff(@Param('branchId') branchId: string) {
    return successResponse(
      'Kiosk staff retrieved',
      await this.kioskService.listBranchStaff(branchId),
    );
  }

  @Post('kiosk/branches/:branchId/check-in')
  async checkIn(@Param('branchId') branchId: string, @Body() dto: KioskPinDto) {
    return successResponse(
      'Check-in recorded',
      await this.kioskService.checkIn(branchId, dto),
    );
  }

  @Post('kiosk/branches/:branchId/check-out')
  async checkOut(
    @Param('branchId') branchId: string,
    @Body() dto: KioskPinDto,
  ) {
    return successResponse(
      'Check-out recorded',
      await this.kioskService.checkOut(branchId, dto),
    );
  }

  @Get('attendance-kiosk/settings')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('kiosk.manage')
  async getSettings() {
    return successResponse(
      'Attendance kiosk settings retrieved',
      await this.kioskService.getSettings(),
    );
  }

  @Patch('attendance-kiosk/settings')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('kiosk.manage')
  async updateSettings(
    @Body() dto: UpdateKioskSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Attendance kiosk settings updated',
      await this.kioskService.updateSettings(dto, user.id),
    );
  }

  @Patch('branches/:branchId/staff-attendance/:attendanceId/override')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard, BranchAccessGuard)
  @RequirePermissions('kiosk.manage')
  @RequireBranchAccess()
  async overrideAttendance(
    @Param('branchId') branchId: string,
    @Param('attendanceId') attendanceId: string,
    @Body() dto: OverrideStaffAttendanceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Staff attendance overridden',
      await this.kioskService.overrideAttendance(
        branchId,
        attendanceId,
        dto,
        user.id,
      ),
    );
  }
}
