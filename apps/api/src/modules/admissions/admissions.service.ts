import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, AccountType, AdmissionStatus, AuditAction, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdmissionListQueryDto } from './dto/admission-list-query.dto';
import { ReviewAdmissionDto } from './dto/review-admission.dto';
import { SubmitAdmissionDto } from './dto/submit-admission.dto';

const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

@Injectable()
export class AdmissionsService {
  constructor(private readonly prisma: PrismaService, private readonly auditService: AuditService) {}

  async submit(dto: SubmitAdmissionDto) {
    const offering = await this.activeOffering(dto.academicOfferingId);
    const organization = await this.organization();
    try {
      const application = await this.prisma.admissionApplication.create({
        data: {
          organizationId: organization.id,
          branchId: offering.branchId,
          academicOfferingId: offering.id,
          studentFullName: dto.studentFullName.trim(), studentCnic: dto.studentCnic,
          guardianFullName: dto.guardianFullName.trim(), guardianContactNumber: dto.guardianContactNumber.trim(),
          previousSchool: dto.previousSchool?.trim(), previousPerformance: dto.previousPerformance?.trim(),
        },
        include: this.applicationInclude,
      });
      await this.audit(undefined, AuditAction.CREATE, 'AdmissionApplication', application.id, { source: 'PUBLIC_SUBMISSION' });
      return application;
    } catch (error) { this.rethrowUnique(error); }
  }

  async list(query: AdmissionListQueryDto, requesterUserId: string) {
    const branches = await this.accessibleBranchIds(requesterUserId);
    const branchIds = query.branchId ? [query.branchId] : branches;
    if (query.branchId && branches && !branches.includes(query.branchId)) throw new ForbiddenException('You do not have access to this branch');
    return this.prisma.admissionApplication.findMany({
      where: { deletedAt: null, ...(query.status ? { status: query.status } : {}), ...(branchIds ? { branchId: { in: branchIds } } : {}) },
      include: this.applicationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string, requesterUserId: string) {
    const application = await this.application(id);
    await this.ensureBranchAccess(requesterUserId, application.branchId);
    return application;
  }

  async review(id: string, dto: ReviewAdmissionDto, actorUserId: string) {
    const application = await this.application(id);
    await this.ensureBranchAccess(actorUserId, application.branchId);
    if (application.status !== AdmissionStatus.PENDING) throw new BadRequestException('This admission has already been reviewed');
    if (dto.status === AdmissionStatus.REJECTED) {
      const rejected = await this.prisma.admissionApplication.update({ where: { id }, data: { status: AdmissionStatus.REJECTED, reviewNote: dto.reviewNote?.trim(), reviewedAt: new Date(), reviewedByUserId: actorUserId }, include: this.applicationInclude });
      await this.audit(actorUserId, AuditAction.UPDATE, 'AdmissionApplication', id, dto); return { application: rejected };
    }
    const initialPassword = this.generatePassword();
    const outcome = await this.prisma.$transaction(async (tx) => {
      let portalUser = await tx.user.findFirst({ where: { accountType: AccountType.LEARNER, contactNumber: application.guardianContactNumber, deletedAt: null } });
      let credentials: { contactNumber: string; initialPassword: string } | undefined;
      if (!portalUser) {
        portalUser = await tx.user.create({ data: { accountType: AccountType.LEARNER, contactNumber: application.guardianContactNumber, fullName: application.guardianFullName, passwordHash: await bcrypt.hash(initialPassword, 12), mustCompleteProfile: true } });
        credentials = { contactNumber: portalUser.contactNumber!, initialPassword };
      }
      if (portalUser.status !== AccountStatus.ACTIVE) throw new BadRequestException('The guardian portal account is unavailable');
      const approved = await tx.admissionApplication.update({ where: { id }, data: { status: AdmissionStatus.APPROVED, reviewNote: dto.reviewNote?.trim(), reviewedAt: new Date(), reviewedByUserId: actorUserId }, include: this.applicationInclude });
      const student = await tx.student.create({ data: { admissionApplicationId: approved.id, guardianPortalUserId: portalUser.id, branchId: approved.branchId, academicOfferingId: approved.academicOfferingId, studentFullName: approved.studentFullName, studentCnic: approved.studentCnic, guardianFullName: approved.guardianFullName, guardianContactNumber: approved.guardianContactNumber, previousSchool: approved.previousSchool, previousPerformance: approved.previousPerformance } });
      return { application: approved, student, credentials };
    });
    await this.audit(actorUserId, AuditAction.UPDATE, 'AdmissionApplication', id, { ...dto, action: 'APPROVE' });
    return outcome;
  }

  async deleteRejected(id: string, actorUserId: string) {
    const application = await this.application(id); await this.ensureBranchAccess(actorUserId, application.branchId);
    if (application.status !== AdmissionStatus.REJECTED) throw new BadRequestException('Only rejected applications can be deleted');
    await this.prisma.admissionApplication.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit(actorUserId, AuditAction.DELETE, 'AdmissionApplication', id);
  }

  async learnerStudents(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, accountType: AccountType.LEARNER, deletedAt: null } });
    if (!user) throw new ForbiddenException('Learner portal access is required');
    return this.prisma.student.findMany({ where: { guardianPortalUserId: user.id, deletedAt: null }, include: { academicOffering: { include: { schoolClass: true, course: true, branch: true } }, admissionApplication: { select: { id: true, status: true, createdAt: true } } }, orderBy: { createdAt: 'desc' } });
  }

  private readonly applicationInclude = { branch: true, academicOffering: { include: { schoolClass: true, course: true } }, student: true } satisfies Prisma.AdmissionApplicationInclude;
  private async organization() { const organization = await this.prisma.organization.findFirst(); if (!organization) throw new NotFoundException('Organization has not been configured'); return organization; }
  private async activeOffering(id: string) { const offering = await this.prisma.academicOffering.findFirst({ where: { id, status: 'ACTIVE', branch: { deletedAt: null } } }); if (!offering) throw new NotFoundException('Academic offering not found'); return offering; }
  private async application(id: string) { const application = await this.prisma.admissionApplication.findFirst({ where: { id, deletedAt: null }, include: this.applicationInclude }); if (!application) throw new NotFoundException('Admission application not found'); return application; }
  private async accessibleBranchIds(userId: string): Promise<string[] | null> { const assignments = await this.prisma.roleAssignment.findMany({ where: { userId }, select: { branchId: true } }); if (assignments.some((assignment) => assignment.branchId === null)) return null; return assignments.flatMap((assignment) => assignment.branchId ? [assignment.branchId] : []); }
  private async ensureBranchAccess(userId: string, branchId: string) { const accessible = await this.accessibleBranchIds(userId); if (accessible && !accessible.includes(branchId)) throw new ForbiddenException('You do not have access to this branch'); }
  private generatePassword() { return Array.from({ length: 10 }, () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]).join(''); }
  private rethrowUnique(error: unknown): never { if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('An admission already exists for this student CNIC in the selected academic offering'); throw error; }
  private async audit(actorUserId: string | undefined, action: AuditAction, entityType: string, entityId: string, changes?: object) { const organization = await this.organization(); await this.auditService.record({ organizationId: organization.id, actorUserId, action, entityType, entityId, changes: changes as unknown as Prisma.InputJsonValue | undefined }); }
}
