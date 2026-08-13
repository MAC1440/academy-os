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
  @Get() @RequirePermissions('notes.read') async list() {
    return successResponse('Announcements retrieved', await this.service.list());
  }
  @Get('learner') async listLearner() {
    return successResponse(
      'Learner announcements retrieved',
      await this.service.list(AnnouncementAudience.LEARNER),
    );
  }
  @Get('staff') async listStaff() {
    return successResponse(
      'Staff announcements retrieved',
      await this.service.list(AnnouncementAudience.STAFF),
    );
  }
  @Post() @RequirePermissions('notes.manage') async create(
    @Body() dto: AnnouncementDto,
  ) {
    return successResponse('Announcement created', await this.service.create(dto));
  }
  @Patch(':id') @RequirePermissions('notes.manage') async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return successResponse(
      'Announcement updated',
      await this.service.update(id, dto),
    );
  }
  @Delete(':id') @RequirePermissions('notes.manage') async remove(
    @Param('id') id: string,
  ) {
    return successResponse('Announcement deleted', await this.service.remove(id));
  }
}
