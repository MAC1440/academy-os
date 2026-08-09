import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AcademicOfferingType, AuditAction, EntityStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAcademicOfferingDto, ReplaceAcademicOfferingSubjectsDto, ReplaceAcademicOfferingTeachersDto, UpdateAcademicOfferingDto } from './dto/academic-offering.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateSchoolClassDto, UpdateSchoolClassDto } from './dto/school-class.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async listSchoolClasses() { const organization = await this.organization(); return this.prisma.schoolClass.findMany({ where: { organizationId: organization.id, deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }); }
  async createSchoolClass(dto: CreateSchoolClassDto, actor: string) { const organization = await this.organization(); return this.createUnique('SchoolClass', dto, actor, () => this.prisma.schoolClass.create({ data: { organizationId: organization.id, name: dto.name.trim(), sortOrder: dto.sortOrder, sectionsEnabled: dto.sectionsEnabled } })); }
  async updateSchoolClass(id: string, dto: UpdateSchoolClassDto, actor: string) {
    const record = await this.schoolClass(id);
    if (dto.sectionsEnabled === false) {
      const sectionedOfferings = await this.prisma.academicOffering.count({ where: { schoolClassId: id, sectionName: { not: null } } });
      if (sectionedOfferings) throw new BadRequestException('Archive or remove sectioned offerings before disabling sections');
    }
    return this.updateUnique('SchoolClass', id, dto, actor, () => this.prisma.schoolClass.update({ where: { id: record.id }, data: { ...this.clean(dto), ...(dto.status === EntityStatus.ARCHIVED ? { deletedAt: new Date() } : {}), ...(dto.status && dto.status !== EntityStatus.ARCHIVED ? { deletedAt: null } : {}) } }));
  }

  async listCourses() { const organization = await this.organization(); return this.prisma.course.findMany({ where: { organizationId: organization.id, deletedAt: null }, orderBy: { name: 'asc' } }); }
  async createCourse(dto: CreateCourseDto, actor: string) { const organization = await this.organization(); return this.createUnique('Course', dto, actor, () => this.prisma.course.create({ data: { organizationId: organization.id, name: dto.name.trim(), description: dto.description?.trim() } })); }
  async updateCourse(id: string, dto: UpdateCourseDto, actor: string) { const record = await this.course(id); return this.updateUnique('Course', id, dto, actor, () => this.prisma.course.update({ where: { id: record.id }, data: { ...this.clean(dto), ...(dto.status === EntityStatus.ARCHIVED ? { deletedAt: new Date() } : {}), ...(dto.status && dto.status !== EntityStatus.ARCHIVED ? { deletedAt: null } : {}) } })); }

  async listSubjects() { const organization = await this.organization(); return this.prisma.subject.findMany({ where: { organizationId: organization.id, deletedAt: null }, orderBy: { name: 'asc' } }); }
  async createSubject(dto: CreateSubjectDto, actor: string) { const organization = await this.organization(); return this.createUnique('Subject', dto, actor, () => this.prisma.subject.create({ data: { organizationId: organization.id, name: dto.name.trim(), code: dto.code?.trim() } })); }
  async updateSubject(id: string, dto: UpdateSubjectDto, actor: string) { const record = await this.subject(id); return this.updateUnique('Subject', id, dto, actor, () => this.prisma.subject.update({ where: { id: record.id }, data: { ...this.clean(dto), ...(dto.status === EntityStatus.ARCHIVED ? { deletedAt: new Date() } : {}), ...(dto.status && dto.status !== EntityStatus.ARCHIVED ? { deletedAt: null } : {}) } })); }

  async listOfferings(branchId: string) { await this.branch(branchId); return this.prisma.academicOffering.findMany({ where: { branchId }, include: this.offeringInclude, orderBy: { createdAt: 'asc' } }); }
  async createOffering(branchId: string, dto: CreateAcademicOfferingDto, actor: string) {
    await this.branch(branchId);
    const source = await this.offeringSource(dto);
    const offering = await this.createUnique('AcademicOffering', dto, actor, () => this.prisma.academicOffering.create({ data: { branchId, offeringType: dto.offeringType, schoolClassId: source.schoolClassId, courseId: source.courseId, sectionName: source.sectionName, offeringKey: source.offeringKey }, include: this.offeringInclude }));
    return offering;
  }
  async updateOffering(branchId: string, offeringId: string, dto: UpdateAcademicOfferingDto, actor: string) {
    const offering = await this.offering(branchId, offeringId);
    let offeringKey = offering.offeringKey;
    if (dto.sectionName !== undefined) {
      if (offering.offeringType !== AcademicOfferingType.SCHOOL_CLASS || !offering.schoolClass) throw new BadRequestException('Courses do not support sections');
      if (offering.schoolClass.sectionsEnabled && !dto.sectionName.trim()) throw new BadRequestException('A section is required for this school class');
      offeringKey = this.offeringKey(offering.offeringType, offering.schoolClassId!, dto.sectionName);
    }
    return this.updateUnique('AcademicOffering', offeringId, dto, actor, () => this.prisma.academicOffering.update({ where: { id: offering.id }, data: { ...this.clean(dto), offeringKey, ...(dto.status === EntityStatus.ARCHIVED ? { } : {}) }, include: this.offeringInclude }));
  }
  async replaceOfferingSubjects(branchId: string, offeringId: string, dto: ReplaceAcademicOfferingSubjectsDto, actor: string) {
    const offering = await this.offering(branchId, offeringId); await this.verifySubjects(dto.subjectIds);
    const updated = await this.prisma.academicOffering.update({ where: { id: offering.id }, data: { subjects: { deleteMany: {}, create: dto.subjectIds.map((subjectId) => ({ subjectId })) } }, include: this.offeringInclude });
    await this.audit(actor, AuditAction.UPDATE, 'AcademicOfferingSubjects', offering.id, dto); return updated;
  }
  async replaceOfferingTeachers(branchId: string, offeringId: string, dto: ReplaceAcademicOfferingTeachersDto, actor: string) {
    const offering = await this.offering(branchId, offeringId); await this.verifyBranchStaff(dto.staffProfileIds, branchId);
    const updated = await this.prisma.academicOffering.update({ where: { id: offering.id }, data: { teachers: { deleteMany: {}, create: dto.staffProfileIds.map((staffProfileId) => ({ staffProfileId })) } }, include: this.offeringInclude });
    await this.audit(actor, AuditAction.UPDATE, 'AcademicOfferingTeachers', offering.id, dto); return updated;
  }

  private readonly offeringInclude = { schoolClass: true, course: true, subjects: { include: { subject: true } }, teachers: { include: { staffProfile: { include: { user: { select: { id: true, fullName: true } } } } } } } satisfies Prisma.AcademicOfferingInclude;
  private async organization() { const organization = await this.prisma.organization.findFirst(); if (!organization) throw new NotFoundException('Organization has not been configured'); return organization; }
  private async branch(id: string) { const branch = await this.prisma.branch.findFirst({ where: { id, deletedAt: null } }); if (!branch) throw new NotFoundException('Branch not found'); return branch; }
  private async schoolClass(id: string) { const organization = await this.organization(); const record = await this.prisma.schoolClass.findFirst({ where: { id, organizationId: organization.id, deletedAt: null } }); if (!record) throw new NotFoundException('School class not found'); return record; }
  private async course(id: string) { const organization = await this.organization(); const record = await this.prisma.course.findFirst({ where: { id, organizationId: organization.id, deletedAt: null } }); if (!record) throw new NotFoundException('Course not found'); return record; }
  private async subject(id: string) { const organization = await this.organization(); const record = await this.prisma.subject.findFirst({ where: { id, organizationId: organization.id, deletedAt: null } }); if (!record) throw new NotFoundException('Subject not found'); return record; }
  private async offering(branchId: string, id: string) { const record = await this.prisma.academicOffering.findFirst({ where: { id, branchId }, include: { schoolClass: true } }); if (!record) throw new NotFoundException('Academic offering not found'); return record; }
  private async offeringSource(dto: CreateAcademicOfferingDto) {
    if (dto.offeringType === AcademicOfferingType.SCHOOL_CLASS) {
      if (!dto.schoolClassId || dto.courseId) throw new BadRequestException('A school-class offering requires only schoolClassId');
      const schoolClass = await this.schoolClass(dto.schoolClassId);
      const sectionName = dto.sectionName?.trim();
      if (schoolClass.sectionsEnabled && !sectionName) throw new BadRequestException('A section is required for this school class');
      if (!schoolClass.sectionsEnabled && sectionName) throw new BadRequestException('Sections are not enabled for this school class');
      return { schoolClassId: schoolClass.id, courseId: null, sectionName: sectionName ?? null, offeringKey: this.offeringKey(dto.offeringType, schoolClass.id, sectionName) };
    }
    if (!dto.courseId || dto.schoolClassId || dto.sectionName) throw new BadRequestException('A course offering requires only courseId and cannot have a section');
    const course = await this.course(dto.courseId); return { schoolClassId: null, courseId: course.id, sectionName: null, offeringKey: this.offeringKey(dto.offeringType, course.id) };
  }
  private offeringKey(type: AcademicOfferingType, sourceId: string, sectionName?: string) { return `${type}:${sourceId}:${sectionName?.trim().toLocaleLowerCase() ?? '-'}`; }
  private async verifySubjects(ids: string[]) { if (!ids.length) return; const organization = await this.organization(); const count = await this.prisma.subject.count({ where: { id: { in: ids }, organizationId: organization.id, deletedAt: null } }); if (count !== ids.length) throw new NotFoundException('One or more subjects were not found'); }
  private async verifyBranchStaff(ids: string[], branchId: string) { if (!ids.length) return; const count = await this.prisma.staffProfile.count({ where: { id: { in: ids }, user: { deletedAt: null, roleAssignments: { some: { branchId } } } } }); if (count !== ids.length) throw new NotFoundException('One or more staff members are not assigned to this branch'); }
  private clean<T extends object>(dto: T): T { return Object.fromEntries(Object.entries(dto).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])) as T; }
  private async createUnique<T>(entityType: string, dto: object, actor: string, operation: () => Promise<T>) { try { const record = await operation(); await this.audit(actor, AuditAction.CREATE, entityType, this.recordId(record), dto); return record; } catch (error) { this.rethrowUnique(error); } }
  private async updateUnique<T>(entityType: string, id: string, dto: object, actor: string, operation: () => Promise<T>) { try { const record = await operation(); await this.audit(actor, AuditAction.UPDATE, entityType, id, dto); return record; } catch (error) { this.rethrowUnique(error); } }
  private recordId(record: unknown) { return (record as { id: string }).id; }
  private rethrowUnique(error: unknown): never { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('A record with this name or branch configuration already exists'); throw error; }
  private async audit(actorUserId: string, action: AuditAction, entityType: string, entityId: string, changes?: object) { const organization = await this.organization(); await this.auditService.record({ organizationId: organization.id, actorUserId, action, entityType, entityId, changes: changes as unknown as Prisma.InputJsonValue | undefined }); }
}
