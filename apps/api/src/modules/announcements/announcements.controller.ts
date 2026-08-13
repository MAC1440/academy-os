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
import { AnnouncementAudience } from '@prisma/client';
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
  @Get() @RequirePermissions('notes.read') list() {
    return successResponse('Announcements retrieved', this.service.list());
  }
  @Get('learner') listLearner() {
    return successResponse(
      'Learner announcements retrieved',
      this.service.list(AnnouncementAudience.LEARNER),
    );
  }
  @Get('staff') listStaff() {
    return successResponse(
      'Staff announcements retrieved',
      this.service.list(AnnouncementAudience.STAFF),
    );
  }
  @Post() @RequirePermissions('notes.manage') create(
    @Body() dto: AnnouncementDto,
  ) {
    return successResponse('Announcement created', this.service.create(dto));
  }
  @Patch(':id') @RequirePermissions('notes.manage') update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return successResponse(
      'Announcement updated',
      this.service.update(id, dto),
    );
  }
  @Delete(':id') @RequirePermissions('notes.manage') remove(
    @Param('id') id: string,
  ) {
    return successResponse('Announcement deleted', this.service.remove(id));
  }
}
