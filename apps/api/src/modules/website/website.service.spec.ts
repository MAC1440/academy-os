import { WebsiteRevisionStatus, WebsiteTemplate } from '@prisma/client';
import { WebsiteService } from './website.service';

describe('WebsiteService publishing', () => {
  const organization = { id: 'organization-a', name: 'Academy A' };
  const config = { id: 'website-a', organizationId: organization.id };
  const draftData = {
    schoolName: 'Academy A',
    template: WebsiteTemplate.MODERN,
    primaryColor: '#740019',
    secondaryColor: '#F4C95D',
    accentColor: '#0F766E',
    headingFont: 'Merriweather',
    bodyFont: 'Inter',
    logoUrl: 'https://school.example/logo.png',
    faviconUrl: 'https://school.example/favicon.png',
    contactEmail: 'hello@school.example',
    phone: '+92 300 1234567',
    address: 'Main Campus, Lahore',
    facebookUrl: 'https://facebook.com/school',
  };

  it('reports required and recommended website content health separately', () => {
    const service = new WebsiteService({} as never, {} as never);
    const health = (
      service as unknown as {
        contentHealth: (settings: object) => {
          readyToPublish: boolean;
          issues: Array<{ id: string; severity: string }>;
        };
      }
    ).contentHealth({
      schoolName: 'Academy A',
      homepage: {
        hero: { title: 'Learn with purpose' },
        contact: { enabled: true },
      },
      seo: { defaultDescription: '' },
    });
    expect(health.readyToPublish).toBe(false);
    expect(health.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'contact', severity: 'REQUIRED' }),
        expect.objectContaining({
          id: 'seo-description',
          severity: 'RECOMMENDED',
        }),
      ]),
    );
  });

  it('returns only the latest published revision to public users', async () => {
    const published = {
      id: 'published-a',
      data: draftData,
      publishedAt: new Date('2026-08-30T12:00:00Z'),
    };
    const prisma = {
      organization: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ websiteConfig: { id: config.id } }),
      },
      websiteRevision: { findFirst: jest.fn().mockResolvedValue(published) },
    };
    const service = new WebsiteService(prisma as never, {} as never);

    await expect(service.published()).resolves.toEqual({
      revisionId: published.id,
      data: draftData,
      publishedAt: published.publishedAt,
    });
    expect(prisma.websiteRevision.findFirst).toHaveBeenCalledWith({
      where: {
        websiteConfigId: config.id,
        status: WebsiteRevisionStatus.PUBLISHED,
      },
      orderBy: { publishedAt: 'desc' },
    });
  });

  it('archives the old publication, publishes the draft, and creates a new draft copy', async () => {
    const draft = {
      id: 'draft-a',
      websiteConfigId: config.id,
      status: WebsiteRevisionStatus.DRAFT,
      data: draftData,
      updatedAt: new Date('2026-08-30T11:00:00Z'),
      publishedAt: null,
      publishedBy: null,
    };
    const published = {
      ...draft,
      status: WebsiteRevisionStatus.PUBLISHED,
      publishedAt: new Date('2026-08-30T12:00:00Z'),
    };
    const nextDraft = {
      ...draft,
      id: 'draft-b',
      updatedAt: new Date('2026-08-30T12:00:00Z'),
    };
    const tx = {
      websiteRevision: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(published),
        create: jest.fn().mockResolvedValue(nextDraft),
      },
    };
    const prisma = {
      roleAssignment: {
        findFirst: jest.fn().mockResolvedValue({ role: { organization } }),
      },
      websiteConfig: { upsert: jest.fn().mockResolvedValue(config) },
      websiteRevision: { findFirst: jest.fn().mockResolvedValue(draft) },
      $transaction: jest.fn().mockImplementation((work) => work(tx)),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new WebsiteService(prisma as never, audit as never);

    const result = await service.publish('admin-a');

    expect(tx.websiteRevision.updateMany).toHaveBeenCalledWith({
      where: {
        websiteConfigId: config.id,
        status: WebsiteRevisionStatus.PUBLISHED,
      },
      data: { status: WebsiteRevisionStatus.ARCHIVED },
    });
    expect(tx.websiteRevision.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: draft.id, status: WebsiteRevisionStatus.DRAFT },
      data: expect.objectContaining({
        status: WebsiteRevisionStatus.PUBLISHED,
        publishedByUserId: 'admin-a',
      }),
    });
    expect(tx.websiteRevision.create).toHaveBeenCalledWith({
      data: {
        websiteConfigId: config.id,
        status: WebsiteRevisionStatus.DRAFT,
        data: draftData,
        createdByUserId: 'admin-a',
      },
    });
    expect(result.published.status).toBe(WebsiteRevisionStatus.PUBLISHED);
    expect(result.draft.id).toBe('draft-b');
  });

  it('copies only public-safe academic and faculty fields into import choices', async () => {
    const prisma = {
      roleAssignment: {
        findFirst: jest.fn().mockResolvedValue({ role: { organization } }),
      },
      schoolClass: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'class-a', name: 'Grade 6' }]),
      },
      course: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'course-a',
            name: 'Robotics',
            description: 'Practical robotics.',
          },
        ]),
      },
      staffProfile: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'staff-a',
            designation: 'Science Teacher',
            user: { fullName: 'Ayesha Khan' },
            academicOfferingAssignments: [
              {
                academicOffering: {
                  subjects: [
                    { subject: { name: 'Science' } },
                    { subject: { name: 'Science' } },
                  ],
                },
              },
            ],
          },
        ]),
      },
    };
    const service = new WebsiteService(prisma as never, {} as never);

    await expect(service.importPrograms('admin-a')).resolves.toEqual([
      { sourceId: 'class:class-a', name: 'Grade 6', sourceType: 'CLASS' },
      {
        sourceId: 'course:course-a',
        name: 'Robotics',
        description: 'Practical robotics.',
        sourceType: 'COURSE',
      },
    ]);
    await expect(service.importFaculty('admin-a')).resolves.toEqual([
      {
        sourceTeacherId: 'staff-a',
        name: 'Ayesha Khan',
        designation: 'Science Teacher',
        subjects: ['Science'],
      },
    ]);
    expect(prisma.staffProfile.findMany.mock.calls[0][0].select.user).toEqual({
      select: { fullName: true },
    });
  });
});
