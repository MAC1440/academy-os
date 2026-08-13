import { Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementAudience } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}
  private async organization() {
    const organization = await this.prisma.organization.findFirst();
    if (!organization)
      throw new NotFoundException('Organization has not been configured');
    return organization;
  }
  async list(audience?: AnnouncementAudience) {
    const organization = await this.organization();
    return this.prisma.announcement.findMany({
      where: {
        organizationId: organization.id,
        deletedAt: null,
        ...(audience
          ? { audience: { in: [AnnouncementAudience.ALL, audience] } }
          : {}),
      },
      orderBy: [{ eventDate: 'asc' }, { createdAt: 'desc' }],
    });
  }
  async create(dto: {
    title: string;
    content: string;
    audience: AnnouncementAudience;
    eventDate?: string;
  }) {
    const organization = await this.organization();
    return this.prisma.announcement.create({
      data: {
        organizationId: organization.id,
        title: dto.title.trim(),
        content: dto.content.trim(),
        audience: dto.audience,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
      },
    });
  }
  async update(
    id: string,
    dto: Partial<{
      title: string;
      content: string;
      audience: AnnouncementAudience;
      eventDate: string;
    }>,
  ) {
    await this.find(id);
    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.audience !== undefined ? { audience: dto.audience } : {}),
        ...(dto.eventDate !== undefined
          ? { eventDate: dto.eventDate ? new Date(dto.eventDate) : null }
          : {}),
      },
    });
  }
  async remove(id: string) {
    await this.find(id);
    await this.prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { id };
  }
  private async find(id: string) {
    const organization = await this.organization();
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }
}
