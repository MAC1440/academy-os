import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebsiteSettingsDto } from './dto/website.dto';
import { WebsiteService } from './website.service';

@ApiTags('Public website')
@Controller('public/website')
export class PublicWebsiteController {
  constructor(private readonly website: WebsiteService) {}

  @Get()
  async published() {
    return successResponse(
      'Published website retrieved',
      await this.website.published(),
    );
  }
}

@ApiTags('Website Manager')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('website')
export class WebsiteController {
  constructor(private readonly website: WebsiteService) {}

  @Get()
  @RequirePermissions('website.read')
  async overview(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      'Website settings retrieved',
      await this.website.overview(user.id),
    );
  }

  @Get('preview')
  @RequirePermissions('website.read')
  async preview(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      'Website preview retrieved',
      await this.website.preview(user.id),
    );
  }

  @Put('draft')
  @RequirePermissions('website.manage')
  async saveDraft(
    @Body() dto: WebsiteSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return successResponse(
      'Website draft saved',
      await this.website.saveDraft(dto, user.id),
    );
  }

  @Post('publish')
  @RequirePermissions('website.publish')
  async publish(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      'Website published',
      await this.website.publish(user.id),
    );
  }
}
