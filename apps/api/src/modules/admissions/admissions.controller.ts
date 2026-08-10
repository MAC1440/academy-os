import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdmissionsService } from './admissions.service';
import { AdmissionListQueryDto } from './dto/admission-list-query.dto';
import { ReviewAdmissionDto } from './dto/review-admission.dto';
import { SubmitAdmissionDto } from './dto/submit-admission.dto';

@ApiTags('Admissions')
@Controller()
export class AdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Post('public/admissions')
  async submit(@Body() dto: SubmitAdmissionDto) {
    return successResponse('Admission application submitted', await this.admissions.submit(dto));
  }

  @Get('admissions')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.read')
  async list(@Query() query: AdmissionListQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Admission applications retrieved', await this.admissions.list(query, user.id));
  }

  @Get('admissions/:admissionId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.read')
  async get(@Param('admissionId') admissionId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Admission application retrieved', await this.admissions.get(admissionId, user.id));
  }

  @Patch('admissions/:admissionId/review')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async review(@Param('admissionId') admissionId: string, @Body() dto: ReviewAdmissionDto, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Admission application reviewed', await this.admissions.review(admissionId, dto, user.id));
  }

  @Delete('admissions/:admissionId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async deleteRejected(@Param('admissionId') admissionId: string, @CurrentUser() user: AuthenticatedUser) {
    await this.admissions.deleteRejected(admissionId, user.id);
    return successResponse('Rejected admission application deleted', { id: admissionId });
  }

  @Get('learner-portal/students')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async learnerStudents(@CurrentUser() user: AuthenticatedUser) {
    return successResponse('Learner portal students retrieved', await this.admissions.learnerStudents(user.id));
  }

  @Get('learner-portal/students/:studentId/attendance')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async learnerStudentAttendance(@Param('studentId') studentId: string, @Query('from') from: string | undefined, @Query('to') to: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Learner student attendance retrieved', await this.admissions.learnerStudentAttendance(user.id, studentId, from, to));
  }

  @Get('learner-portal/students/:studentId/performance')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async learnerStudentPerformance(@Param('studentId') studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Learner student performance retrieved', await this.admissions.learnerStudentPerformance(user.id, studentId));
  }

  @Get('learner-portal/students/:studentId/finance')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async learnerStudentFinance(@Param('studentId') studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return successResponse('Learner student finance retrieved', await this.admissions.learnerStudentFinance(user.id, studentId));
  }
}
