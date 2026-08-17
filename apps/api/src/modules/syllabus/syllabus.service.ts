import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateSessionSyllabusDto,
  SyllabusClassDto,
  UpdateSessionSyllabusDto,
} from './dto/syllabus.dto';

@Injectable()
export class SyllabusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const organization = await this.organization();
    return this.prisma.sessionSyllabus.findMany({
      where: { organizationId: organization.id, deletedAt: null },
      select: {
        id: true,
        sessionYear: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { sessionYear: 'desc' },
    });
  }

  async get(id: string) {
    const organization = await this.organization();
    const syllabus = await this.prisma.sessionSyllabus.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
    });
    if (!syllabus) throw new NotFoundException('Syllabus session not found');
    return syllabus;
  }

  async create(dto: CreateSessionSyllabusDto, actorUserId: string) {
    const organization = await this.organization();
    const classes = this.normalizeClasses(dto.classes);
    this.validateDocument(classes);
    try {
      const syllabus = await this.prisma.sessionSyllabus.create({
        data: {
          organizationId: organization.id,
          sessionYear: dto.sessionYear.trim(),
          classes: classes as unknown as Prisma.InputJsonValue,
        },
      });
      await this.recordAudit(actorUserId, AuditAction.CREATE, syllabus.id, {
        sessionYear: syllabus.sessionYear,
        classCount: classes.length,
      });
      return syllabus;
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error))
        throw new ConflictException(
          `A syllabus already exists for ${dto.sessionYear.trim()}`,
        );
      throw error;
    }
  }

  async update(id: string, dto: UpdateSessionSyllabusDto, actorUserId: string) {
    const current = await this.get(id);
    const classes = this.normalizeClasses(dto.classes);
    this.validateDocument(classes);
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.sessionSyllabus.updateMany({
        where: {
          id: current.id,
          organizationId: current.organizationId,
          deletedAt: null,
          updatedAt: new Date(dto.expectedUpdatedAt),
        },
        data: { classes: classes as unknown as Prisma.InputJsonValue },
      });
      if (result.count !== 1)
        throw new ConflictException(
          'This syllabus changed after you opened it. Reload the latest version before saving again.',
        );
      return tx.sessionSyllabus.findUniqueOrThrow({
        where: { id: current.id },
      });
    });
    await this.recordAudit(actorUserId, AuditAction.UPDATE, updated.id, {
      sessionYear: updated.sessionYear,
      classCount: classes.length,
    });
    return updated;
  }

  async archive(id: string, actorUserId: string) {
    const syllabus = await this.get(id);
    await this.prisma.sessionSyllabus.update({
      where: { id: syllabus.id },
      data: { deletedAt: new Date() },
    });
    await this.recordAudit(actorUserId, AuditAction.DELETE, syllabus.id, {
      sessionYear: syllabus.sessionYear,
    });
    return { id: syllabus.id };
  }

  private normalizeClasses(classes: SyllabusClassDto[]): SyllabusClassDto[] {
    return classes.map((item) => ({
      className: item.className.trim(),
      groups: item.groups.map((group) => ({
        name: group.name.trim(),
        subjects: group.subjects.map((subject) => ({
          subjectName: subject.subjectName.trim(),
          content: subject.content.trim(),
        })),
      })),
    }));
  }

  private validateDocument(classes: SyllabusClassDto[]) {
    if (classes.some((item) => !item.className))
      throw new BadRequestException('Every syllabus class must have a name');
    if (classes.some((item) => item.groups.some((group) => !group.name)))
      throw new BadRequestException('Every syllabus group must have a name');
    if (
      classes.some((item) =>
        item.groups.some((group) =>
          group.subjects.some((subject) => !subject.subjectName),
        ),
      )
    )
      throw new BadRequestException('Every syllabus subject must have a name');
    const names = classes.map((item) => item.className.toLocaleLowerCase());
    if (new Set(names).size !== names.length)
      throw new ConflictException(
        'A class can appear only once in the same syllabus session',
      );
  }

  private async organization() {
    const organization = await this.prisma.organization.findFirst();
    if (!organization)
      throw new NotFoundException('Organization has not been configured');
    return organization;
  }

  private async recordAudit(
    actorUserId: string,
    action: AuditAction,
    entityId: string,
    changes: Prisma.InputJsonValue,
  ) {
    const organization = await this.organization();
    await this.audit.record({
      organizationId: organization.id,
      actorUserId,
      action,
      entityType: 'SessionSyllabus',
      entityId,
      changes,
    });
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
