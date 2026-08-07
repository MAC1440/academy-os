import {
  Body,
  Controller,
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
import { CreateStaffProfileDto } from '../dto/create-staff-profile.dto';
import { ResetStaffPinDto } from '../dto/reset-staff-pin.dto';
import { UpdateStaffProfileDto } from '../dto/update-staff-profile.dto';
import { StaffProfileService } from '../services/staff-profile.service';
import { TenantAccessService } from '../services/tenant-access.service';

@ApiTags('Teachers and staff')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:academyId/staff')
@UseGuards(JwtAuthGuard)
export class StaffProfileController {
  constructor(
    private readonly staff: StaffProfileService,
    private readonly tenantAccess: TenantAccessService,
  ) {}
  @Get() async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId);
    return successResponse(
      'Staff retrieved',
      await this.staff.findAll(academyId),
    );
  }
  @Post() async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Body() dto: CreateStaffProfileDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Staff profile created',
      await this.staff.create(academyId, dto),
    );
  }
  @Patch(':id') async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStaffProfileDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Staff profile updated',
      await this.staff.update(academyId, id, dto),
    );
  }
  @Patch(':id/pin') async resetPin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Param('id') id: string,
    @Body() dto: ResetStaffPinDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Staff PIN reset',
      await this.staff.resetPin(academyId, id, dto),
    );
  }
}
