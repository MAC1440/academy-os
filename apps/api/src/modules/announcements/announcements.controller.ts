import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AccountType, AnnouncementAudience } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AnnouncementsService } from './announcements.service';
class AnnouncementDto {
  @IsString() @MaxLength(140) title!: string;
  @IsString() @MaxLength(5000) content!: string;
  @IsEnum(AnnouncementAudience) audience!: AnnouncementAudience;
  @IsOptional() @IsDateString() eventDate?: string;
}
class UpdateAnnouncementDto {
  @IsOptional() @IsString() @MaxLength(140) title?: string;
  @IsOptional() @IsString() @MaxLength(5000) content?: string;
  @IsOptional() @IsEnum(AnnouncementAudience) audience?: AnnouncementAudience;
  @IsOptional() @IsDateString() eventDate?: string;
}
@Controller('announcements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}
  @Get() @RequirePermissions('announcements.read') async list() {
    return successResponse(
      'Announcements retrieved',
      await this.service.list(),
    );
  }
  @Get('learner') async listLearner(@CurrentUser() user: AuthenticatedUser) {
    this.requireAccountType(user, AccountType.LEARNER);
    return successResponse(
      'Learner announcements retrieved',
      await this.service.list(AnnouncementAudience.LEARNER),
    );
  }
  @Get('staff') async listStaff(@CurrentUser() user: AuthenticatedUser) {
    this.requireAccountType(user, AccountType.STAFF);
    return successResponse(
      'Staff announcements retrieved',
      await this.service.list(AnnouncementAudience.STAFF),
    );
  }
  @Post() @RequirePermissions('announcements.manage') async create(
    @Body() dto: AnnouncementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAccountType(user, AccountType.ADMIN);
    return successResponse(
      'Announcement created',
      await this.service.create(dto),
    );
  }
  @Patch(':id') @RequirePermissions('announcements.manage') async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAccountType(user, AccountType.ADMIN);
    return successResponse(
      'Announcement updated',
      await this.service.update(id, dto),
    );
  }
  @Delete(':id') @RequirePermissions('announcements.manage') async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.requireAccountType(user, AccountType.ADMIN);
    return successResponse(
      'Announcement deleted',
      await this.service.remove(id),
    );
  }

  private requireAccountType(
    user: AuthenticatedUser,
    accountType: AccountType,
  ) {
    if (user.accountType !== accountType)
      throw new ForbiddenException(
        'This portal endpoint is not available for this account',
      );
  }
}
