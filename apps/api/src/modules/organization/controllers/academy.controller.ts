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
import { PlatformAdminGuard } from '../../auth/guards/platform-admin.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { successResponse } from '../../../common/api-response';
import { CreateAcademyDto } from '../dto/create-academy.dto';
import { ListQueryDto } from '../dto/list-query.dto';
import { UpdateAcademyDto } from '../dto/update-academy.dto';
import { AcademyService } from '../services/academy.service';
import { TenantAccessService } from '../services/tenant-access.service';

@ApiTags('Academies')
@ApiBearerAuth('JWT-auth')
@Controller('academies')
@UseGuards(JwtAuthGuard)
export class AcademyController {
  constructor(
    private readonly academyService: AcademyService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Post()
  @UseGuards(PlatformAdminGuard)
  async create(@Body() dto: CreateAcademyDto) {
    const academy = await this.academyService.create(dto);
    return successResponse('Academy created', academy);
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListQueryDto,
  ) {
    const result = await this.academyService.findAll(
      query,
      await this.tenantAccess.getAccessibleAcademyIds(user),
    );
    return successResponse('Academies retrieved', result.items, result.meta);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, id);
    const academy = await this.academyService.findOne(id);
    return successResponse('Academy retrieved', academy);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAcademyDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, id, true);
    const academy = await this.academyService.update(id, dto);
    return successResponse('Academy updated', academy);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, id, true);
    const result = await this.academyService.remove(id);
    return successResponse('Academy deleted', result);
  }
}
