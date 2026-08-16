import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  BulkSaveTimetableAssignmentsDto,
  CreateTimetableDailyOverrideDto,
  CreateTimetableProfileDto,
  TimetablePreviewDto,
  TimetableProfileStateDto,
  UpdateTimetableProfileDto,
} from './dto/timetable.dto';
import { TimetableService } from './timetable.service';

@ApiTags('Timetable')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class TimetableController {
  constructor(private readonly timetable: TimetableService) {}

  @Post('timetable/preview')
  @RequirePermissions('timetable.read')
  preview(@Body() dto: TimetablePreviewDto) {
    return successResponse(
      'Timetable timeline preview generated',
      this.timetable.preview(dto),
    );
  }

  @Get('branches/:branchId/timetable-profiles')
  @RequirePermissions('timetable.read')
  async listProfiles(
    @Param('branchId') branchId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Timetable profiles retrieved',
      await this.timetable.listProfiles(branchId, user.id),
    );
  }

  @Post('branches/:branchId/timetable-profiles')
  @RequirePermissions('timetable.manage')
  async createProfile(
    @Param('branchId') branchId: string,
    @Body() dto: CreateTimetableProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Timetable profile created',
      await this.timetable.createProfile(branchId, dto, user.id),
    );
  }

  @Get('timetable-profiles/:profileId')
  @RequirePermissions('timetable.read')
  async getProfile(
    @Param('profileId') profileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Timetable profile retrieved',
      await this.timetable.getProfile(profileId, user.id),
    );
  }

  @Patch('timetable-profiles/:profileId')
  @RequirePermissions('timetable.manage')
  async updateProfile(
    @Param('profileId') profileId: string,
    @Body() dto: UpdateTimetableProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Timetable profile updated',
      await this.timetable.updateProfile(profileId, dto, user.id),
    );
  }

  @Patch('timetable-profiles/:profileId/active')
  @RequirePermissions('timetable.manage')
  async setActive(
    @Param('profileId') profileId: string,
    @Body() dto: TimetableProfileStateDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      dto.isActive
        ? 'Timetable profile activated'
        : 'Timetable profile deactivated',
      await this.timetable.setProfileActive(profileId, dto.isActive, user.id),
    );
  }

  @Delete('timetable-profiles/:profileId')
  @RequirePermissions('timetable.manage')
  async archive(
    @Param('profileId') profileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Timetable profile archived',
      await this.timetable.archiveProfile(profileId, user.id),
    );
  }

  @Get('academic-offerings/:offeringId/effective-timetable-profile')
  @RequirePermissions('timetable.read')
  async effectiveProfile(
    @Param('offeringId') offeringId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Effective timetable profile retrieved',
      await this.timetable.effectiveProfile(offeringId, user.id),
    );
  }

  @Get('academic-offerings/:offeringId/timetable')
  @RequirePermissions('timetable.read')
  async classTimetable(
    @Param('offeringId') offeringId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Class timetable retrieved',
      await this.timetable.classTimetable(offeringId, user.id),
    );
  }

  @Put('academic-offerings/:offeringId/timetable/:profileId/assignments')
  @RequirePermissions('timetable.manage')
  async saveAssignments(
    @Param('offeringId') offeringId: string,
    @Param('profileId') profileId: string,
    @Body() dto: BulkSaveTimetableAssignmentsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Class timetable saved',
      await this.timetable.saveAssignments(offeringId, profileId, dto, user.id),
    );
  }

  @Get('timetable/daily-overrides')
  @RequirePermissions('timetable.manage')
  async listDailyOverrides(
    @Query('branchId') branchId: string,
    @Query('date') date: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Daily timetable overrides retrieved',
      await this.timetable.listDailyOverrides(branchId, date, user.id),
    );
  }

  @Post('timetable/daily-overrides')
  @RequirePermissions('timetable.manage')
  async createDailyOverride(
    @Body() dto: CreateTimetableDailyOverrideDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Daily timetable cover saved',
      await this.timetable.createDailyOverride(dto, user.id),
    );
  }

  @Delete('timetable/daily-overrides/:overrideId')
  @RequirePermissions('timetable.manage')
  async removeDailyOverride(
    @Param('overrideId') overrideId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Daily timetable cover removed',
      await this.timetable.removeDailyOverride(overrideId, user.id),
    );
  }

  @Get('staff/:staffProfileId/timetable')
  @RequirePermissions('timetable.read')
  async teacherTimetable(
    @Param('staffProfileId') staffProfileId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Teacher timetable retrieved',
      await this.timetable.teacherTimetable(staffProfileId, user.id),
    );
  }

  // Keep this under the timetable namespace. `/staff/:staffId` is a generic
  // staff route and would otherwise capture `staff/my-timetable` first.
  @Get('timetable/staff/my-timetable')
  @RequirePermissions('timetable.read')
  async myTimetable(
    @Query('weekOf') weekOf: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'My timetable retrieved',
      await this.timetable.myTimetable(user.id, weekOf),
    );
  }
}
