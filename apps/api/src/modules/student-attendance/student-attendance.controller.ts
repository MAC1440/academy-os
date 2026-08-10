import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SaveStudentAttendanceDto } from './dto/mark-attendance.dto';
import { StudentAttendanceService } from './student-attendance.service';

@ApiTags('Student Attendance') @ApiBearerAuth('JWT-auth') @UseGuards(JwtAuthGuard, PermissionsGuard) @Controller('academic-offerings/:offeringId/student-attendance')
export class StudentAttendanceController {
  constructor(private readonly service: StudentAttendanceService) {}
  @Get() @RequirePermissions('attendance.read') async roster(@Param('offeringId') offeringId: string, @Query('date') date: string, @CurrentUser() user: AuthenticatedUser) { return successResponse('Student attendance roster retrieved', await this.service.roster(offeringId, date, user.id)); }
  @Put() @RequirePermissions('attendance.manage') async save(@Param('offeringId') offeringId: string, @Body() dto: SaveStudentAttendanceDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Student attendance saved', await this.service.save(offeringId, dto, user.id)); }
}
