import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  Prisma,
  WebsiteRevisionStatus,
  WebsiteTemplate,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { WebsiteSettingsDto } from './dto/website.dto';

export type WebsiteSettings = {
  schoolName: string;
  tagline?: string;
  template: WebsiteTemplate;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

@Injectable()
export class WebsiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async published() {
    const organization = await this.prisma.organization.findFirst({
      select: { websiteConfig: { select: { id: true } } },
    });
    if (!organization?.websiteConfig) return null;
    const revision = await this.prisma.websiteRevision.findFirst({
      where: {
        websiteConfigId: organization.websiteConfig.id,
        status: WebsiteRevisionStatus.PUBLISHED,
      },
      orderBy: { publishedAt: 'desc' },
    });
    return revision ? this.publicRevision(revision) : null;
  }

  async overview(actorUserId: string) {
    const { organization, config } = await this.ensureConfig(actorUserId);
    const [draft, published] = await Promise.all([
      this.latest(config.id, WebsiteRevisionStatus.DRAFT),
      this.latest(config.id, WebsiteRevisionStatus.PUBLISHED),
    ]);
    return {
      status: published ? 'PUBLISHED' : 'UNPUBLISHED',
      hasUnpublishedChanges: Boolean(
        draft &&
        (!published ||
          JSON.stringify(draft.data) !== JSON.stringify(published.data)),
      ),
      draft: draft ? this.managerRevision(draft) : null,
      published: published ? this.managerRevision(published) : null,
      organization: { id: organization.id, name: organization.name },
    };
  }

  async preview(actorUserId: string) {
    const { config } = await this.ensureConfig(actorUserId);
    const draft = await this.latest(config.id, WebsiteRevisionStatus.DRAFT);
    if (!draft) throw new NotFoundException('Website draft not found');
    return this.managerRevision(draft);
  }

  async saveDraft(dto: WebsiteSettingsDto, actorUserId: string) {
    const { organization, config } = await this.ensureConfig(actorUserId);
    const data = this.normalize(dto);
    const draft = await this.latest(config.id, WebsiteRevisionStatus.DRAFT);
    const saved = draft
      ? await this.prisma.websiteRevision.update({
          where: { id: draft.id },
          data: {
            data: data as unknown as Prisma.InputJsonValue,
            createdByUserId: actorUserId,
          },
        })
      : await this.prisma.websiteRevision.create({
          data: {
            websiteConfigId: config.id,
            status: WebsiteRevisionStatus.DRAFT,
            data: data as unknown as Prisma.InputJsonValue,
            createdByUserId: actorUserId,
          },
        });
    await this.audit.record({
      organizationId: organization.id,
      actorUserId,
      action: AuditAction.UPDATE,
      entityType: 'WebsiteRevision',
      entityId: saved.id,
      changes: { operation: 'SAVE_DRAFT', template: data.template },
    });
    return this.managerRevision(saved);
  }

  async publish(actorUserId: string) {
    const { organization, config } = await this.ensureConfig(actorUserId);
    const draft = await this.latest(config.id, WebsiteRevisionStatus.DRAFT);
    if (!draft)
      throw new BadRequestException('Save a website draft before publishing');
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.websiteRevision.updateMany({
        where: {
          websiteConfigId: config.id,
          status: WebsiteRevisionStatus.PUBLISHED,
        },
        data: { status: WebsiteRevisionStatus.ARCHIVED },
      });
      const promotion = await tx.websiteRevision.updateMany({
        where: { id: draft.id, status: WebsiteRevisionStatus.DRAFT },
        data: {
          status: WebsiteRevisionStatus.PUBLISHED,
          publishedAt: now,
          publishedByUserId: actorUserId,
        },
      });
      if (promotion.count !== 1)
        throw new ConflictException(
          'This draft was already published. Reload Website Manager before publishing again.',
        );
      const published = await tx.websiteRevision.findUniqueOrThrow({
        where: { id: draft.id },
      });
      const nextDraft = await tx.websiteRevision.create({
        data: {
          websiteConfigId: config.id,
          status: WebsiteRevisionStatus.DRAFT,
          data: draft.data as Prisma.InputJsonValue,
          createdByUserId: actorUserId,
        },
      });
      return { published, nextDraft };
    });
    await this.audit.record({
      organizationId: organization.id,
      actorUserId,
      action: AuditAction.UPDATE,
      entityType: 'WebsiteRevision',
      entityId: result.published.id,
      changes: { operation: 'PUBLISH' },
    });
    return {
      published: this.managerRevision(result.published),
      draft: this.managerRevision(result.nextDraft),
    };
  }

  private async ensureConfig(actorUserId: string) {
    const assignment = await this.prisma.roleAssignment.findFirst({
      where: { userId: actorUserId },
      select: { role: { select: { organization: true } } },
    });
    const organization = assignment?.role.organization;
    if (!organization)
      throw new NotFoundException('Organization access not found');
    const config = await this.prisma.websiteConfig.upsert({
      where: { organizationId: organization.id },
      update: {},
      create: {
        organizationId: organization.id,
        revisions: {
          create: {
            status: WebsiteRevisionStatus.DRAFT,
            createdByUserId: actorUserId,
            data: this.defaults(
              organization.name,
            ) as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });
    return { organization, config };
  }

  private latest(websiteConfigId: string, status: WebsiteRevisionStatus) {
    return this.prisma.websiteRevision.findFirst({
      where: { websiteConfigId, status },
      include: { publishedBy: { select: { id: true, fullName: true } } },
      orderBy:
        status === WebsiteRevisionStatus.PUBLISHED
          ? { publishedAt: 'desc' }
          : { updatedAt: 'desc' },
    });
  }

  private normalize(dto: WebsiteSettingsDto): WebsiteSettings {
    const schoolName = dto.schoolName.trim();
    if (!schoolName) throw new BadRequestException('School name is required');
    return {
      schoolName,
      ...(dto.tagline?.trim() ? { tagline: dto.tagline.trim() } : {}),
      template: dto.template,
      primaryColor: dto.primaryColor.toUpperCase(),
      secondaryColor: dto.secondaryColor.toUpperCase(),
      accentColor: dto.accentColor.toUpperCase(),
    };
  }

  private defaults(schoolName: string): WebsiteSettings {
    return {
      schoolName,
      template: WebsiteTemplate.CLASSIC,
      primaryColor: '#740019',
      secondaryColor: '#F4C95D',
      accentColor: '#0F766E',
    };
  }

  private managerRevision(revision: {
    id: string;
    status: WebsiteRevisionStatus;
    data: Prisma.JsonValue;
    updatedAt: Date;
    publishedAt: Date | null;
    publishedBy?: { id: string; fullName: string } | null;
  }) {
    return {
      id: revision.id,
      status: revision.status,
      data: revision.data as WebsiteSettings,
      updatedAt: revision.updatedAt,
      publishedAt: revision.publishedAt,
      publishedBy: revision.publishedBy ?? null,
    };
  }

  private publicRevision(revision: {
    id: string;
    data: Prisma.JsonValue;
    publishedAt: Date | null;
  }) {
    return {
      revisionId: revision.id,
      data: revision.data as WebsiteSettings,
      publishedAt: revision.publishedAt,
    };
  }
}
