import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../../common/api-response';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { UpdateAcademicSettingsDto } from '../dto/update-academic-settings.dto';
import { AcademicSettingsService } from '../services/academic-settings.service';
import { TenantAccessService } from '../services/tenant-access.service';

@ApiTags('Academic structure')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:academyId/academic-settings')
@UseGuards(JwtAuthGuard)
export class AcademicSettingsController {
  constructor(
    private readonly settings: AcademicSettingsService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Get()
  async find(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId);
    return successResponse(
      'Academic settings retrieved',
      await this.settings.findOrCreate(academyId),
    );
  }

  @Patch()
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Body() dto: UpdateAcademicSettingsDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Academic settings updated',
      await this.settings.update(academyId, dto),
    );
  }
}
