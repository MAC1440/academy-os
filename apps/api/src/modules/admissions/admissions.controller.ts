import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { AdmissionsService } from './admissions.service';
import { AdmissionListQueryDto } from './dto/admission-list-query.dto';
import { ReviewAdmissionDto } from './dto/review-admission.dto';
import { SubmitAdmissionDto } from './dto/submit-admission.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateAdmissionDto } from './dto/update-admission.dto';
import {
  BulkStudentImportDto,
  BulkStudentImportPreviewDto,
} from './dto/bulk-student-import.dto';

@ApiTags('Admissions')
@Controller()
export class AdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Post('public/admissions')
  async submit(@Body() dto: SubmitAdmissionDto) {
    return successResponse(
      'Admission application submitted',
      await this.admissions.submit(dto),
    );
  }

  @Get('admissions')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.read')
  async list(
    @Query() query: AdmissionListQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Admission applications retrieved',
      await this.admissions.list(query, user.id),
    );
  }

  @Get('admissions/:admissionId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.read')
  async get(
    @Param('admissionId') admissionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Admission application retrieved',
      await this.admissions.get(admissionId, user.id),
    );
  }

  @Patch('admissions/:admissionId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async update(
    @Param('admissionId') admissionId: string,
    @Body() dto: UpdateAdmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Admission application updated',
      await this.admissions.update(admissionId, dto, user.id),
    );
  }

  @Get('students')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.read')
  async students(
    @Query('branchId') branchId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Students retrieved',
      await this.admissions.listStudents(user.id, branchId),
    );
  }

  @Get('students/:studentId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.read')
  async student(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Student retrieved',
      await this.admissions.getStudent(studentId, user.id),
    );
  }

  @Patch('students/:studentId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async updateStudent(
    @Param('studentId') studentId: string,
    @Body() dto: UpdateStudentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Student updated',
      await this.admissions.updateStudent(studentId, dto, user.id),
    );
  }

  @Post('students/:studentId/guardian-credentials/reset')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async resetGuardianCredentials(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Guardian temporary credentials reset',
      await this.admissions.resetGuardianCredentials(studentId, user.id),
    );
  }

  @Delete('students/:studentId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async deleteStudent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Student deleted',
      await this.admissions.deleteStudent(studentId, user.id),
    );
  }

  @Post('students/bulk-import')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async bulkImportStudents(
    @Body() dto: BulkStudentImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Student import completed',
      await this.admissions.bulkImportStudents(dto, user.id),
    );
  }

  @Post('students/bulk-import/preview')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async previewBulkImport(@Body() dto: BulkStudentImportPreviewDto) {
    return successResponse(
      'Student import preview created',
      await this.admissions.previewBulkImport(dto),
    );
  }

  @Patch('admissions/:admissionId/review')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async review(
    @Param('admissionId') admissionId: string,
    @Body() dto: ReviewAdmissionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Admission application reviewed',
      await this.admissions.review(admissionId, dto, user.id),
    );
  }

  @Delete('admissions/:admissionId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('admissions.manage')
  async deleteRejected(
    @Param('admissionId') admissionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.admissions.deleteRejected(admissionId, user.id);
    return successResponse('Rejected admission application deleted', {
      id: admissionId,
    });
  }

  @Get('learner-portal/students')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async learnerStudents(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      'Learner portal students retrieved',
      await this.admissions.learnerStudents(user.id),
    );
  }

  @Get('learner-portal/students/:studentId/attendance')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async learnerStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Learner student attendance retrieved',
      await this.admissions.learnerStudentAttendance(
        user.id,
        studentId,
        from,
        to,
      ),
    );
  }

  @Get('learner-portal/students/:studentId/performance')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async learnerStudentPerformance(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Learner student performance retrieved',
      await this.admissions.learnerStudentPerformance(user.id, studentId),
    );
  }

  @Get('learner-portal/students/:studentId/finance')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async learnerStudentFinance(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Learner student finance retrieved',
      await this.admissions.learnerStudentFinance(user.id, studentId),
    );
  }
}
