import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { successResponse } from '../../common/api-response';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebsiteSettingsDto } from './dto/website.dto';
import {
  AlbumDto,
  AnnouncementDto,
  GalleryImageDto,
  MediaUploadDto,
  NewsDto,
  ResultDto,
} from './dto/website-content.dto';
import { WebsiteContentService } from './website-content.service';
import { WebsiteService } from './website.service';

@ApiTags('Public website')
@Controller('public/website')
export class PublicWebsiteController {
  constructor(
    private readonly website: WebsiteService,
    private readonly content: WebsiteContentService,
  ) {}

  @Get()
  async published() {
    return successResponse(
      'Published website retrieved',
      await this.website.published(),
    );
  }

  @Get('content') async publishedContent() {
    return successResponse(
      'Published website content retrieved',
      await this.content.publicBundle(),
    );
  }
  @Get('news/:slug') async news(@Param('slug') slug: string) {
    return successResponse(
      'News article retrieved',
      await this.content.publicNews(slug),
    );
  }
  @Get('gallery/:slug') async album(@Param('slug') slug: string) {
    return successResponse(
      'Gallery album retrieved',
      await this.content.publicAlbum(slug),
    );
  }
}

@ApiTags('Website Manager')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('website')
export class WebsiteController {
  constructor(
    private readonly website: WebsiteService,
    private readonly content: WebsiteContentService,
  ) {}

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

  @Get('imports/programs')
  @RequirePermissions('website.manage')
  async importPrograms(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      'Academic programs retrieved',
      await this.website.importPrograms(user.id),
    );
  }

  @Get('imports/faculty')
  @RequirePermissions('website.manage')
  async importFaculty(@CurrentUser() user: AuthenticatedUser) {
    return successResponse(
      'Public-safe faculty sources retrieved',
      await this.website.importFaculty(user.id),
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

  @Get('content') @RequirePermissions('website.read') async managerContent() {
    return successResponse(
      'Website content retrieved',
      await this.content.managerBundle(),
    );
  }
  @Post('announcements')
  @RequirePermissions('website.manage')
  async createAnnouncement(@Body() dto: AnnouncementDto) {
    return successResponse(
      'Announcement created',
      await this.content.createAnnouncement(dto),
    );
  }
  @Patch('announcements/:id')
  @RequirePermissions('website.manage')
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() dto: AnnouncementDto,
  ) {
    return successResponse(
      'Announcement updated',
      await this.content.updateAnnouncement(id, dto),
    );
  }
  @Delete('announcements/:id')
  @RequirePermissions('website.manage')
  async deleteAnnouncement(@Param('id') id: string) {
    return successResponse(
      'Announcement deleted',
      await this.content.deleteAnnouncement(id),
    );
  }
  @Post('news') @RequirePermissions('website.manage') async createNews(
    @Body() dto: NewsDto,
  ) {
    return successResponse('News created', await this.content.createNews(dto));
  }
  @Patch('news/:id') @RequirePermissions('website.manage') async updateNews(
    @Param('id') id: string,
    @Body() dto: NewsDto,
  ) {
    return successResponse(
      'News updated',
      await this.content.updateNews(id, dto),
    );
  }
  @Delete('news/:id') @RequirePermissions('website.manage') async deleteNews(
    @Param('id') id: string,
  ) {
    return successResponse('News deleted', await this.content.deleteNews(id));
  }
  @Post('results') @RequirePermissions('website.manage') async createResult(
    @Body() dto: ResultDto,
  ) {
    return successResponse(
      'Result highlight created',
      await this.content.createResult(dto),
    );
  }
  @Patch('results/:id')
  @RequirePermissions('website.manage')
  async updateResult(@Param('id') id: string, @Body() dto: ResultDto) {
    return successResponse(
      'Result highlight updated',
      await this.content.updateResult(id, dto),
    );
  }
  @Delete('results/:id')
  @RequirePermissions('website.manage')
  async deleteResult(@Param('id') id: string) {
    return successResponse(
      'Result highlight deleted',
      await this.content.deleteResult(id),
    );
  }
  @Post('albums') @RequirePermissions('website.manage') async createAlbum(
    @Body() dto: AlbumDto,
  ) {
    return successResponse(
      'Gallery album created',
      await this.content.createAlbum(dto),
    );
  }
  @Patch('albums/:id') @RequirePermissions('website.manage') async updateAlbum(
    @Param('id') id: string,
    @Body() dto: AlbumDto,
  ) {
    return successResponse(
      'Gallery album updated',
      await this.content.updateAlbum(id, dto),
    );
  }
  @Delete('albums/:id') @RequirePermissions('website.manage') async deleteAlbum(
    @Param('id') id: string,
  ) {
    return successResponse(
      'Gallery album deleted',
      await this.content.deleteAlbum(id),
    );
  }
  @Post('albums/:id/images')
  @RequirePermissions('website.manage')
  async addAlbumImage(@Param('id') id: string, @Body() dto: GalleryImageDto) {
    return successResponse(
      'Image added to album',
      await this.content.addImage(id, dto),
    );
  }
  @Delete('albums/:id/images/:mediaId')
  @RequirePermissions('website.manage')
  async removeAlbumImage(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return successResponse(
      'Image removed from album',
      await this.content.removeImage(id, mediaId),
    );
  }
  @Post('media/upload')
  @RequirePermissions('website.manage')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async uploadMedia(
    @UploadedFile()
    file:
      | { buffer: Buffer; originalname: string; mimetype: string; size: number }
      | undefined,
    @Body() dto: MediaUploadDto,
  ) {
    return successResponse(
      'Image uploaded',
      await this.content.upload(file, dto.category),
    );
  }
}
