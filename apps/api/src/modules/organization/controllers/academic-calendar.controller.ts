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
import { successResponse } from '../../../common/api-response';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { CreateCalendarDayDto } from '../dto/create-calendar-day.dto';
import { UpdateWorkingDaysDto } from '../dto/update-working-days.dto';
import { AcademicCalendarService } from '../services/academic-calendar.service';
import { TenantAccessService } from '../services/tenant-access.service';

@ApiTags('Academic calendar')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:academyId/academic-calendar')
@UseGuards(JwtAuthGuard)
export class AcademicCalendarController {
  constructor(
    private readonly calendar: AcademicCalendarService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Get()
  async overview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId);
    return successResponse(
      'Academic calendar retrieved',
      await this.calendar.overview(academyId),
    );
  }

  @Post('years')
  async createYear(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Body() dto: CreateAcademicYearDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Academic year created',
      await this.calendar.createYear(academyId, dto),
    );
  }

  @Patch('working-days')
  async workingDays(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Body() dto: UpdateWorkingDaysDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Working days updated',
      await this.calendar.replaceWorkingDays(academyId, dto.weekdays),
    );
  }

  @Post('days')
  async addDay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Body() dto: CreateCalendarDayDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Calendar day created',
      await this.calendar.addCalendarDay(academyId, dto),
    );
  }

  @Delete('days/:id')
  async removeDay(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Param('id') id: string,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Calendar day deleted',
      await this.calendar.removeCalendarDay(academyId, id),
    );
  }
}
