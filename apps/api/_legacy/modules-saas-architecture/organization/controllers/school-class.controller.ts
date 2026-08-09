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
import { CreateClassSectionDto } from '../dto/create-class-section.dto';
import { CreateSchoolClassDto } from '../dto/create-school-class.dto';
import { UpdateSchoolClassDto } from '../dto/update-school-class.dto';
import { SchoolClassService } from '../services/school-class.service';
import { TenantAccessService } from '../services/tenant-access.service';

@ApiTags('Academic structure')
@ApiBearerAuth('JWT-auth')
@Controller()
@UseGuards(JwtAuthGuard)
export class SchoolClassController {
  constructor(
    private readonly classes: SchoolClassService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Get('branches/:branchId/classes')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId') branchId: string,
  ) {
    await this.tenantAccess.assertBranchAccess(user, branchId);
    return successResponse(
      'School classes retrieved',
      await this.classes.findAll(branchId),
    );
  }

  @Post('branches/:branchId/classes')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('branchId') branchId: string,
    @Body() dto: CreateSchoolClassDto,
  ) {
    await this.tenantAccess.assertBranchAccess(user, branchId, true);
    return successResponse(
      'School class created',
      await this.classes.create(branchId, dto),
    );
  }

  @Patch('school-classes/:id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSchoolClassDto,
  ) {
    const schoolClass = await this.classes.findOne(id);
    await this.tenantAccess.assertBranchAccess(
      user,
      schoolClass.branchId,
      true,
    );
    return successResponse(
      'School class updated',
      await this.classes.update(id, dto),
    );
  }

  @Delete('school-classes/:id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const schoolClass = await this.classes.findOne(id);
    await this.tenantAccess.assertBranchAccess(
      user,
      schoolClass.branchId,
      true,
    );
    return successResponse(
      'School class deleted',
      await this.classes.remove(id),
    );
  }

  @Post('school-classes/:id/sections')
  async addSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateClassSectionDto,
  ) {
    const schoolClass = await this.classes.findOne(id);
    await this.tenantAccess.assertBranchAccess(
      user,
      schoolClass.branchId,
      true,
    );
    return successResponse(
      'Class section created',
      await this.classes.addSection(id, dto),
    );
  }
}
