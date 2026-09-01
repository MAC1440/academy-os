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
  logoUrl?: string;
  faviconUrl?: string;
  template: WebsiteTemplate;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  homepage: {
    hero: {
      enabled: boolean;
      title: string;
      subtitle?: string;
      imageUrl?: string;
      ctaText?: string;
      ctaLink?: string;
    };
    introduction: {
      enabled: boolean;
      heading: string;
      content: string;
      imageUrl?: string;
    };
    principalMessage: {
      enabled: boolean;
      name?: string;
      designation?: string;
      message?: string;
      imageUrl?: string;
    };
    programs: { enabled: boolean };
    facilities: { enabled: boolean };
    faculty: { enabled: boolean };
    contact: { enabled: boolean };
  };
  programs: Array<{
    sourceId?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    visible: boolean;
    sortOrder: number;
  }>;
  facilities: Array<{
    title: string;
    description?: string;
    imageUrl?: string;
    visible: boolean;
    sortOrder: number;
  }>;
  faculty: Array<{
    sourceTeacherId?: string;
    name: string;
    designation: string;
    qualification?: string;
    subjects: string[];
    bio?: string;
    imageUrl?: string;
    visible: boolean;
    sortOrder: number;
  }>;
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

  async importPrograms(actorUserId: string) {
    const organization = await this.organizationFor(actorUserId);
    const [classes, courses] = await Promise.all([
      this.prisma.schoolClass.findMany({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: 'ACTIVE',
        },
        select: { id: true, name: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.course.findMany({
        where: {
          organizationId: organization.id,
          deletedAt: null,
          status: 'ACTIVE',
        },
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return [
      ...classes.map((item) => ({
        sourceId: `class:${item.id}`,
        name: item.name,
        sourceType: 'CLASS' as const,
      })),
      ...courses.map((item) => ({
        sourceId: `course:${item.id}`,
        name: item.name,
        description: item.description ?? undefined,
        sourceType: 'COURSE' as const,
      })),
    ];
  }

  async importFaculty(actorUserId: string) {
    const organization = await this.organizationFor(actorUserId);
    const staff = await this.prisma.staffProfile.findMany({
      where: {
        user: {
          deletedAt: null,
          status: 'ACTIVE',
          roleAssignments: {
            some: { role: { organizationId: organization.id } },
          },
        },
      },
      select: {
        id: true,
        designation: true,
        user: { select: { fullName: true } },
        academicOfferingAssignments: {
          select: {
            academicOffering: {
              select: {
                subjects: { select: { subject: { select: { name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { user: { fullName: 'asc' } },
    });
    return staff.map((item) => ({
      sourceTeacherId: item.id,
      name: item.user.fullName,
      designation: item.designation || 'Teacher',
      subjects: [
        ...new Set(
          item.academicOfferingAssignments.flatMap((assignment) =>
            assignment.academicOffering.subjects.map(
              (subject) => subject.subject.name,
            ),
          ),
        ),
      ].sort(),
    }));
  }

  private async organizationFor(actorUserId: string) {
    const assignment = await this.prisma.roleAssignment.findFirst({
      where: { userId: actorUserId },
      select: { role: { select: { organization: true } } },
    });
    if (!assignment?.role.organization)
      throw new NotFoundException('Organization access not found');
    return assignment.role.organization;
  }

  private async ensureConfig(actorUserId: string) {
    const organization = await this.organizationFor(actorUserId);
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
    const optional = (value?: string) => value?.trim() || undefined;
    return {
      schoolName,
      ...(optional(dto.tagline) ? { tagline: optional(dto.tagline) } : {}),
      ...(optional(dto.logoUrl) ? { logoUrl: optional(dto.logoUrl) } : {}),
      ...(optional(dto.faviconUrl)
        ? { faviconUrl: optional(dto.faviconUrl) }
        : {}),
      template: dto.template,
      primaryColor: dto.primaryColor.toUpperCase(),
      secondaryColor: dto.secondaryColor.toUpperCase(),
      accentColor: dto.accentColor.toUpperCase(),
      headingFont: dto.headingFont,
      bodyFont: dto.bodyFont,
      ...(optional(dto.contactEmail)
        ? { contactEmail: optional(dto.contactEmail) }
        : {}),
      ...(optional(dto.phone) ? { phone: optional(dto.phone) } : {}),
      ...(optional(dto.address) ? { address: optional(dto.address) } : {}),
      ...(optional(dto.facebookUrl)
        ? { facebookUrl: optional(dto.facebookUrl) }
        : {}),
      ...(optional(dto.instagramUrl)
        ? { instagramUrl: optional(dto.instagramUrl) }
        : {}),
      ...(optional(dto.youtubeUrl)
        ? { youtubeUrl: optional(dto.youtubeUrl) }
        : {}),
      homepage: dto.homepage,
      programs: dto.programs.map((item, index) => ({
        ...item,
        name: item.name.trim(),
        description: optional(item.description),
        imageUrl: optional(item.imageUrl),
        sortOrder: item.sortOrder ?? index,
      })),
      facilities: dto.facilities.map((item, index) => ({
        ...item,
        title: item.title.trim(),
        description: optional(item.description),
        imageUrl: optional(item.imageUrl),
        sortOrder: item.sortOrder ?? index,
      })),
      faculty: dto.faculty.map((item, index) => ({
        ...item,
        name: item.name.trim(),
        designation: item.designation.trim(),
        qualification: optional(item.qualification),
        bio: optional(item.bio),
        imageUrl: optional(item.imageUrl),
        subjects: item.subjects
          .map((subject) => subject.trim())
          .filter(Boolean),
        sortOrder: item.sortOrder ?? index,
      })),
    };
  }

  private defaults(schoolName: string): WebsiteSettings {
    return {
      schoolName,
      template: WebsiteTemplate.CLASSIC,
      primaryColor: '#740019',
      secondaryColor: '#F4C95D',
      accentColor: '#0F766E',
      headingFont: 'Merriweather',
      bodyFont: 'Inter',
      homepage: {
        hero: { enabled: true, title: schoolName },
        introduction: {
          enabled: false,
          heading: 'Welcome to our school',
          content: '',
        },
        principalMessage: { enabled: false },
        programs: { enabled: false },
        facilities: { enabled: false },
        faculty: { enabled: false },
        contact: { enabled: true },
      },
      programs: [],
      facilities: [],
      faculty: [],
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
