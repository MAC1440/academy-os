import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, WebsiteMediaCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AlbumDto,
  AnnouncementDto,
  GalleryImageDto,
  NewsDto,
  ResultDto,
} from './dto/website-content.dto';

type Upload = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class WebsiteContentService {
  constructor(private readonly prisma: PrismaService) {}

  private async organizationId() {
    const organization = await this.prisma.organization.findFirst({
      select: { id: true },
    });
    if (!organization) throw new NotFoundException('Organization not found');
    return organization.id;
  }

  private schedule(value?: string) {
    return value ? new Date(value) : null;
  }

  private validSlug(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!slug) throw new BadRequestException('Enter a valid URL slug');
    return slug;
  }

  async managerBundle() {
    const organizationId = await this.organizationId();
    const [announcements, news, results, albums, media, events] =
      await Promise.all([
        this.prisma.websiteAnnouncement.findMany({
          where: { organizationId },
          orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
        }),
        this.prisma.websiteNews.findMany({
          where: { organizationId },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.websiteResult.findMany({
          where: { organizationId },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.websiteGalleryAlbum.findMany({
          where: { organizationId },
          include: {
            images: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
          },
          orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        }),
        this.prisma.websiteMedia.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.academicCalendarDay.findMany({
          where: { organizationId, label: { not: null } },
          orderBy: { calendarDate: 'desc' },
        }),
      ]);
    return { announcements, news, results, albums, media, events };
  }

  async publicBundle() {
    const organizationId = await this.organizationId();
    const now = new Date();
    const scheduled = {
      published: true,
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    };
    const [announcements, news, results, events, albums] = await Promise.all([
      this.prisma.websiteAnnouncement.findMany({
        where: {
          organizationId,
          ...scheduled,
          OR: undefined,
          AND: [
            { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
            { OR: [{ expireAt: null }, { expireAt: { gt: now } }] },
          ],
        },
        orderBy: [{ pinned: 'desc' }, { publishAt: 'desc' }],
      }),
      this.prisma.websiteNews.findMany({
        where: { organizationId, ...scheduled },
        orderBy: { publishAt: 'desc' },
      }),
      this.prisma.websiteResult.findMany({
        where: { organizationId, ...scheduled },
        orderBy: { publishAt: 'desc' },
      }),
      this.prisma.academicCalendarDay.findMany({
        where: {
          organizationId,
          visibility: 'PUBLIC',
          label: { not: null },
          calendarDate: {
            gte: new Date(new Date().toISOString().slice(0, 10)),
          },
        },
        orderBy: { calendarDate: 'asc' },
      }),
      this.prisma.websiteGalleryAlbum.findMany({
        where: { organizationId, published: true },
        include: {
          images: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);
    return { announcements, news, results, events, albums };
  }

  async publicNews(slug: string) {
    const organizationId = await this.organizationId();
    const item = await this.prisma.websiteNews.findFirst({
      where: {
        organizationId,
        slug,
        published: true,
        OR: [{ publishAt: null }, { publishAt: { lte: new Date() } }],
      },
    });
    if (!item) throw new NotFoundException('News article not found');
    return item;
  }

  async publicAlbum(slug: string) {
    const organizationId = await this.organizationId();
    const item = await this.prisma.websiteGalleryAlbum.findFirst({
      where: { organizationId, slug, published: true },
      include: {
        academicCalendarDay: true,
        images: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!item) throw new NotFoundException('Gallery album not found');
    return item;
  }

  async createAnnouncement(dto: AnnouncementDto) {
    return this.prisma.websiteAnnouncement.create({
      data: {
        ...dto,
        organizationId: await this.organizationId(),
        publishAt: this.schedule(dto.publishAt),
        expireAt: this.schedule(dto.expireAt),
      },
    });
  }
  async updateAnnouncement(id: string, dto: AnnouncementDto) {
    return this.prisma.websiteAnnouncement.update({
      where: { id },
      data: {
        ...dto,
        publishAt: this.schedule(dto.publishAt),
        expireAt: this.schedule(dto.expireAt),
      },
    });
  }
  async deleteAnnouncement(id: string) {
    return this.prisma.websiteAnnouncement.delete({ where: { id } });
  }
  async createNews(dto: NewsDto) {
    return this.prisma.websiteNews.create({
      data: {
        ...dto,
        slug: this.validSlug(dto.slug),
        organizationId: await this.organizationId(),
        publishAt: this.schedule(dto.publishAt),
      },
    });
  }
  async updateNews(id: string, dto: NewsDto) {
    return this.prisma.websiteNews.update({
      where: { id },
      data: {
        ...dto,
        slug: this.validSlug(dto.slug),
        publishAt: this.schedule(dto.publishAt),
      },
    });
  }
  async deleteNews(id: string) {
    return this.prisma.websiteNews.delete({ where: { id } });
  }
  async createResult(dto: ResultDto) {
    return this.prisma.websiteResult.create({
      data: {
        ...dto,
        organizationId: await this.organizationId(),
        highlights: dto.highlights,
        publishAt: this.schedule(dto.publishAt),
      },
    });
  }
  async updateResult(id: string, dto: ResultDto) {
    return this.prisma.websiteResult.update({
      where: { id },
      data: {
        ...dto,
        highlights: dto.highlights,
        publishAt: this.schedule(dto.publishAt),
      },
    });
  }
  async deleteResult(id: string) {
    return this.prisma.websiteResult.delete({ where: { id } });
  }
  async createAlbum(dto: AlbumDto) {
    return this.prisma.websiteGalleryAlbum.create({
      data: {
        ...dto,
        slug: this.validSlug(dto.slug),
        organizationId: await this.organizationId(),
      },
    });
  }
  async updateAlbum(id: string, dto: AlbumDto) {
    return this.prisma.websiteGalleryAlbum.update({
      where: { id },
      data: { ...dto, slug: this.validSlug(dto.slug) },
    });
  }
  async deleteAlbum(id: string) {
    return this.prisma.websiteGalleryAlbum.delete({ where: { id } });
  }
  async addImage(albumId: string, dto: GalleryImageDto) {
    return this.prisma.websiteGalleryImage.upsert({
      where: { albumId_mediaId: { albumId, mediaId: dto.mediaId } },
      update: { caption: dto.caption, sortOrder: dto.sortOrder },
      create: { albumId, ...dto },
    });
  }
  async removeImage(albumId: string, mediaId: string) {
    return this.prisma.websiteGalleryImage.delete({
      where: { albumId_mediaId: { albumId, mediaId } },
    });
  }

  async upload(file: Upload | undefined, category: WebsiteMediaCategory) {
    if (!file) throw new BadRequestException('Choose an image to upload');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are supported',
      );
    if (file.size > 5 * 1024 * 1024)
      throw new BadRequestException('Images must be 5 MB or smaller');
    if (!file.buffer)
      throw new BadRequestException('The uploaded image could not be read');
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey)
      throw new ServiceUnavailableException('Image uploads are not configured');
    let providerFileId: string | undefined;
    try {
      const form = new FormData();
      form.append(
        'file',
        new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
        file.originalname,
      );
      form.append('fileName', file.originalname);
      form.append('folder', `/academy-os/${category.toLowerCase()}`);
      const response = await fetch(
        'https://upload.imagekit.io/api/v1/files/upload',
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`,
          },
          body: form,
        },
      );
      if (!response.ok)
        throw new ServiceUnavailableException(
          'ImageKit could not upload this image',
        );
      const uploaded = (await response.json()) as {
        fileId: string;
        name: string;
        url: string;
        width?: number;
        height?: number;
        size: number;
        fileType?: string;
      };
      providerFileId = uploaded.fileId;
      return await this.prisma.websiteMedia.create({
        data: {
          organizationId: await this.organizationId(),
          providerFileId: uploaded.fileId,
          name: uploaded.name,
          url: uploaded.url,
          width: uploaded.width,
          height: uploaded.height,
          mimeType: file.mimetype,
          size: uploaded.size,
          category,
        },
      });
    } catch (error) {
      if (providerFileId)
        await fetch(
          `https://api.imagekit.io/v1/files/${encodeURIComponent(providerFileId)}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`,
            },
          },
        ).catch(() => undefined);
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      )
        throw error;
      throw new ServiceUnavailableException(
        'ImageKit could not upload this image. Check the account keys and try again.',
      );
    }
  }

  async deleteMedia(id: string) {
    const media = await this.prisma.websiteMedia.findUnique({
      where: { id },
      include: { galleryImages: { select: { id: true } } },
    });
    if (!media) throw new NotFoundException('Media item not found');
    if (media.galleryImages.length)
      throw new BadRequestException(
        'Remove this image from its gallery albums first',
      );
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey)
      throw new ServiceUnavailableException('Image uploads are not configured');
    const response = await fetch(
      `https://api.imagekit.io/v1/files/${encodeURIComponent(media.providerFileId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`,
        },
      },
    );
    if (!response.ok && response.status !== 404)
      throw new ServiceUnavailableException(
        'ImageKit could not remove this image',
      );
    return this.prisma.websiteMedia.delete({ where: { id } });
  }
}
