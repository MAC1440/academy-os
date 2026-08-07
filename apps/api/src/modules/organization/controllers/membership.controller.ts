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
import { AddOrganizationMemberDto } from '../dto/add-organization-member.dto';
import { UpdateMemberBranchesDto } from '../dto/update-member-branches.dto';
import { MembershipService } from '../services/membership.service';
import { TenantAccessService } from '../services/tenant-access.service';

@ApiTags('Organization members')
@ApiBearerAuth('JWT-auth')
@Controller('organizations/:academyId/memberships')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(
    private readonly memberships: MembershipService,
    private readonly tenantAccess: TenantAccessService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Organization members retrieved',
      await this.memberships.findAll(academyId),
    );
  }

  @Post()
  async add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Body() dto: AddOrganizationMemberDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Organization member added',
      await this.memberships.add(academyId, dto.fullName, dto.email, dto.branchIds),
    );
  }

  @Patch(':membershipId/branches')
  async updateBranches(
    @CurrentUser() user: AuthenticatedUser,
    @Param('academyId') academyId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberBranchesDto,
  ) {
    await this.tenantAccess.assertAcademyAccess(user, academyId, true);
    return successResponse(
      'Member branches updated',
      await this.memberships.updateBranches(
        academyId,
        membershipId,
        dto.branchIds,
      ),
    );
  }
}
