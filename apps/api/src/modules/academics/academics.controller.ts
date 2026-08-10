import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequireBranchAccess } from '../access/decorators/require-branch-access.decorator';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { BranchAccessGuard } from '../access/guards/branch-access.guard';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicsService } from './academics.service';
import { CreateAcademicOfferingDto, ReplaceAcademicOfferingSubjectsDto, ReplaceAcademicOfferingTeachersDto, UpdateAcademicOfferingDto } from './dto/academic-offering.dto';
import { CreateAcademicGroupDto, ReplaceAcademicGroupSchoolClassesDto, UpdateAcademicGroupDto } from './dto/academic-group.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateSchoolClassDto, UpdateSchoolClassDto } from './dto/school-class.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@ApiTags('Academics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class AcademicsController {
  constructor(private readonly academics: AcademicsService) {}

  @Get('school-classes') @RequirePermissions('academics.read') async listSchoolClasses() { return successResponse('School classes retrieved', await this.academics.listSchoolClasses()); }
  @Post('school-classes') @RequirePermissions('academics.manage') async createSchoolClass(@Body() dto: CreateSchoolClassDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('School class created', await this.academics.createSchoolClass(dto, user.id)); }
  @Patch('school-classes/:schoolClassId') @RequirePermissions('academics.manage') async updateSchoolClass(@Param('schoolClassId') id: string, @Body() dto: UpdateSchoolClassDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('School class updated', await this.academics.updateSchoolClass(id, dto, user.id)); }

  @Get('academic-groups') @RequirePermissions('academics.read') async listAcademicGroups() { return successResponse('Academic groups retrieved', await this.academics.listAcademicGroups()); }
  @Post('academic-groups') @RequirePermissions('academics.manage') async createAcademicGroup(@Body() dto: CreateAcademicGroupDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Academic group created', await this.academics.createAcademicGroup(dto, user.id)); }
  @Patch('academic-groups/:academicGroupId') @RequirePermissions('academics.manage') async updateAcademicGroup(@Param('academicGroupId') id: string, @Body() dto: UpdateAcademicGroupDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Academic group updated', await this.academics.updateAcademicGroup(id, dto, user.id)); }
  @Put('academic-groups/:academicGroupId/school-classes') @RequirePermissions('academics.manage') async replaceAcademicGroupSchoolClasses(@Param('academicGroupId') id: string, @Body() dto: ReplaceAcademicGroupSchoolClassesDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Academic group school classes updated', await this.academics.replaceAcademicGroupSchoolClasses(id, dto, user.id)); }

  @Get('courses') @RequirePermissions('academics.read') async listCourses() { return successResponse('Courses retrieved', await this.academics.listCourses()); }
  @Post('courses') @RequirePermissions('academics.manage') async createCourse(@Body() dto: CreateCourseDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Course created', await this.academics.createCourse(dto, user.id)); }
  @Patch('courses/:courseId') @RequirePermissions('academics.manage') async updateCourse(@Param('courseId') id: string, @Body() dto: UpdateCourseDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Course updated', await this.academics.updateCourse(id, dto, user.id)); }

  @Get('subjects') @RequirePermissions('academics.read') async listSubjects() { return successResponse('Subjects retrieved', await this.academics.listSubjects()); }
  @Post('subjects') @RequirePermissions('academics.manage') async createSubject(@Body() dto: CreateSubjectDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Subject created', await this.academics.createSubject(dto, user.id)); }
  @Patch('subjects/:subjectId') @RequirePermissions('academics.manage') async updateSubject(@Param('subjectId') id: string, @Body() dto: UpdateSubjectDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Subject updated', await this.academics.updateSubject(id, dto, user.id)); }

  @Get('branches/:branchId/academic-offerings') @RequirePermissions('academics.read') @RequireBranchAccess() @UseGuards(BranchAccessGuard)
  async listOfferings(@Param('branchId') branchId: string) { return successResponse('Academic offerings retrieved', await this.academics.listOfferings(branchId)); }
  @Post('branches/:branchId/academic-offerings') @RequirePermissions('academics.manage') @RequireBranchAccess() @UseGuards(BranchAccessGuard)
  async createOffering(@Param('branchId') branchId: string, @Body() dto: CreateAcademicOfferingDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Academic offering created', await this.academics.createOffering(branchId, dto, user.id)); }
  @Patch('branches/:branchId/academic-offerings/:offeringId') @RequirePermissions('academics.manage') @RequireBranchAccess() @UseGuards(BranchAccessGuard)
  async updateOffering(@Param('branchId') branchId: string, @Param('offeringId') offeringId: string, @Body() dto: UpdateAcademicOfferingDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Academic offering updated', await this.academics.updateOffering(branchId, offeringId, dto, user.id)); }
  @Put('branches/:branchId/academic-offerings/:offeringId/subjects') @RequirePermissions('academics.manage') @RequireBranchAccess() @UseGuards(BranchAccessGuard)
  async replaceSubjects(@Param('branchId') branchId: string, @Param('offeringId') offeringId: string, @Body() dto: ReplaceAcademicOfferingSubjectsDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Academic offering subjects updated', await this.academics.replaceOfferingSubjects(branchId, offeringId, dto, user.id)); }
  @Put('branches/:branchId/academic-offerings/:offeringId/teachers') @RequirePermissions('academics.manage') @RequireBranchAccess() @UseGuards(BranchAccessGuard)
  async replaceTeachers(@Param('branchId') branchId: string, @Param('offeringId') offeringId: string, @Body() dto: ReplaceAcademicOfferingTeachersDto, @CurrentUser() user: AuthenticatedUser) { return successResponse('Academic offering teachers updated', await this.academics.replaceOfferingTeachers(branchId, offeringId, dto, user.id)); }
}
