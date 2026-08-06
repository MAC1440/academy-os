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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { successResponse } from '../../../common/api-response';
import { BranchListQueryDto } from '../dto/branch-list-query.dto';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BranchService } from '../services/branch.service';
import { TenantAccessService } from '../services/tenant-access.service';

@ApiTags('Branches')
@ApiBearerAuth('JWT-auth')
@Controller('branches')
@UseGuards(JwtAuthGuard)
export class BranchController {
  constructor(
    private readonly branchService: BranchService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBranchDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, dto.academyId, true);
    const branch = await this.branchService.create(dto);
    return successResponse('Branch created', branch);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: BranchListQueryDto,
  ) {
    if (query.academyId)
      await this.tenantAccess.assertAcademyAccess(user, query.academyId);
    const result = await this.branchService.findAll(
      query,
      await this.tenantAccess.getAccessibleBranchIds(user),
    );
    return successResponse('Branches retrieved', result.items, result.meta);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.tenantAccess.assertBranchAccess(user, id);
    const branch = await this.branchService.findOne(id);
    return successResponse('Branch retrieved', branch);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    await this.tenantAccess.assertBranchAccess(user, id, true);
    const branch = await this.branchService.update(id, dto);
    return successResponse('Branch updated', branch);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.tenantAccess.assertBranchAccess(user, id, true);
    const result = await this.branchService.remove(id);
    return successResponse('Branch deleted', result);
  }
}
