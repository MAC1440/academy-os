import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  AccountType,
  AdmissionStatus,
  AuditAction,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdmissionListQueryDto } from './dto/admission-list-query.dto';
import { ReviewAdmissionDto } from './dto/review-admission.dto';
import { SubmitAdmissionDto } from './dto/submit-admission.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  BulkStudentImportDto,
  BulkStudentImportRowDto,
} from './dto/bulk-student-import.dto';

const PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

@Injectable()
export class AdmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async submit(dto: SubmitAdmissionDto) {
    const offering = await this.activeOffering(dto.academicOfferingId);
    const organization = await this.organization();
    try {
      const application = await this.prisma.admissionApplication.create({
        data: {
          organizationId: organization.id,
          branchId: offering.branchId,
          academicOfferingId: offering.id,
          studentFullName: dto.studentFullName.trim(),
          studentCnic: dto.studentCnic,
          guardianFullName: dto.guardianFullName.trim(),
          guardianContactNumber: dto.guardianContactNumber.trim(),
          previousSchool: dto.previousSchool?.trim(),
          previousPerformance: dto.previousPerformance?.trim(),
          formData: dto.formData as Prisma.InputJsonValue | undefined,
        },
        include: this.applicationInclude,
      });
      await this.audit(
        undefined,
        AuditAction.CREATE,
        'AdmissionApplication',
        application.id,
        { source: 'PUBLIC_SUBMISSION' },
      );
      return application;
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async list(query: AdmissionListQueryDto, requesterUserId: string) {
    const branches = await this.accessibleBranchIds(requesterUserId);
    const branchIds = query.branchId ? [query.branchId] : branches;
    if (query.branchId && branches && !branches.includes(query.branchId))
      throw new ForbiddenException('You do not have access to this branch');
    return this.prisma.admissionApplication.findMany({
      where: {
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
        ...(branchIds ? { branchId: { in: branchIds } } : {}),
      },
      include: this.applicationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string, requesterUserId: string) {
    const application = await this.application(id);
    await this.ensureBranchAccess(requesterUserId, application.branchId);
    return application;
  }

  async listStudents(requesterUserId: string, branchId?: string) {
    const accessibleBranches = await this.accessibleBranchIds(requesterUserId);
    if (
      branchId &&
      accessibleBranches &&
      !accessibleBranches.includes(branchId)
    )
      throw new ForbiddenException('You do not have access to this branch');
    const branchIds = branchId ? [branchId] : accessibleBranches;
    return this.prisma.student.findMany({
      where: {
        deletedAt: null,
        ...(branchIds ? { branchId: { in: branchIds } } : {}),
      },
      include: this.studentInclude,
      orderBy: { studentFullName: 'asc' },
    });
  }

  async getStudent(id: string, requesterUserId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: this.studentInclude,
    });
    if (!student) throw new NotFoundException('Student not found');
    await this.ensureBranchAccess(requesterUserId, student.branchId);
    return student;
  }

  async updateStudent(id: string, dto: UpdateStudentDto, actorUserId: string) {
    const student = await this.getStudent(id, actorUserId);
    const nextOffering = dto.academicOfferingId
      ? await this.activeOffering(dto.academicOfferingId)
      : undefined;
    if (nextOffering) {
      await this.ensureBranchAccess(actorUserId, nextOffering.branchId);
    }
    if (dto.academicTermId) {
      const organization = await this.organization();
      const term = await this.prisma.academicTerm.findFirst({
        where: {
          id: dto.academicTermId,
          organizationId: organization.id,
          isActive: true,
        },
      });
      if (!term) throw new NotFoundException('Active academic term not found');
    }
    try {
      const updated = await this.prisma.student.update({
        where: { id: student.id },
        data: {
          ...(dto.studentFullName
            ? { studentFullName: dto.studentFullName.trim() }
            : {}),
          ...(dto.studentCnic ? { studentCnic: dto.studentCnic } : {}),
          ...(dto.previousSchool !== undefined
            ? { previousSchool: dto.previousSchool.trim() || null }
            : {}),
          ...(dto.previousPerformance !== undefined
            ? { previousPerformance: dto.previousPerformance.trim() || null }
            : {}),
          ...(nextOffering
            ? {
                academicOfferingId: nextOffering.id,
                branchId: nextOffering.branchId,
              }
            : {}),
          ...(dto.academicTermId ? { academicTermId: dto.academicTermId } : {}),
        },
        include: this.studentInclude,
      });
      await this.audit(
        actorUserId,
        AuditAction.UPDATE,
        'Student',
        updated.id,
        dto,
      );
      return updated;
    } catch (error) {
      this.rethrowUnique(error);
    }
  }

  async bulkImportStudents(dto: BulkStudentImportDto, actorUserId: string) {
    const results: Array<{
      row: number;
      studentName: string;
      success: boolean;
      message: string;
    }> = [];
    for (const [index, row] of dto.rows.entries()) {
      try {
        const offering = await this.offeringForImport(row);
        await this.ensureBranchAccess(actorUserId, offering.branchId);
        const organization = await this.organization();
        const term = await this.prisma.academicTerm.findFirst({
          where: {
            organizationId: organization.id,
            name: row.academicTermName.trim(),
            isActive: true,
          },
        });
        if (!term)
          throw new NotFoundException(
            `Active academic term "${row.academicTermName}" was not found`,
          );
        const application = await this.submit({
          academicOfferingId: offering.id,
          studentFullName: row.studentFullName,
          studentCnic: row.studentCnic,
          guardianFullName: row.guardianFullName,
          guardianContactNumber: row.guardianContactNumber,
          previousSchool: row.previousSchool,
          previousPerformance: row.previousPerformance,
        });
        await this.review(
          application.id,
          {
            status: AdmissionStatus.APPROVED,
            academicOfferingId: offering.id,
            academicTermId: term.id,
            monthlyFeeAmount: row.monthlyFeeAmount,
            amountReceivedWithForm: row.amountReceivedWithForm,
            openingBalanceAmount: row.openingBalanceAmount,
            receiptNumber: row.receiptNumber,
            balanceDueOn: row.balanceDueOn,
            reviewNote: row.admissionNote,
            physicalDocumentsVerified: row.physicalDocumentsVerified ?? false,
          },
          actorUserId,
        );
        results.push({
          row: index + 2,
          studentName: row.studentFullName,
          success: true,
          message: 'Imported',
        });
      } catch (error) {
        results.push({
          row: index + 2,
          studentName: row.studentFullName,
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Could not import this row',
        });
      }
    }
    return {
      imported: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
      results,
    };
  }

  async review(id: string, dto: ReviewAdmissionDto, actorUserId: string) {
    const application = await this.application(id);
    await this.ensureBranchAccess(actorUserId, application.branchId);
    if (application.status !== AdmissionStatus.PENDING)
      throw new BadRequestException('This admission has already been reviewed');
    if (dto.status === AdmissionStatus.REJECTED) {
      const rejected = await this.prisma.admissionApplication.update({
        where: { id },
        data: {
          status: AdmissionStatus.REJECTED,
          reviewNote: dto.reviewNote?.trim(),
          reviewedAt: new Date(),
          reviewedByUserId: actorUserId,
        },
        include: this.applicationInclude,
      });
      await this.audit(
        actorUserId,
        AuditAction.UPDATE,
        'AdmissionApplication',
        id,
        dto,
      );
      return { application: rejected };
    }
    if (!dto.academicTermId)
      throw new BadRequestException(
        'An academic term is required for approval',
      );
    const allocatedOffering = await this.activeOffering(
      dto.academicOfferingId ?? application.academicOfferingId,
    );
    await this.ensureBranchAccess(actorUserId, allocatedOffering.branchId);
    const academicTerm = await this.prisma.academicTerm.findFirst({
      where: {
        id: dto.academicTermId,
        organizationId: application.organizationId,
        isActive: true,
      },
    });
    if (!academicTerm)
      throw new NotFoundException('Active academic term not found');
    const initialPassword = this.generatePassword();
    const outcome = await this.prisma.$transaction(async (tx) => {
      let portalUser = await tx.user.findFirst({
        where: {
          accountType: AccountType.LEARNER,
          contactNumber: application.guardianContactNumber,
          deletedAt: null,
        },
      });
      let credentials:
        { contactNumber: string; initialPassword: string } | undefined;
      if (!portalUser) {
        portalUser = await tx.user.create({
          data: {
            accountType: AccountType.LEARNER,
            contactNumber: application.guardianContactNumber,
            fullName: application.guardianFullName,
            passwordHash: await bcrypt.hash(initialPassword, 12),
            mustCompleteProfile: true,
          },
        });
        credentials = {
          contactNumber: portalUser.contactNumber!,
          initialPassword,
        };
      }
      if (portalUser.status !== AccountStatus.ACTIVE)
        throw new BadRequestException(
          'The guardian portal account is unavailable',
        );
      const settings = await tx.admissionRegistrationSettings.upsert({
        where: { organizationId: application.organizationId },
        update: {},
        create: { organizationId: application.organizationId },
      });
      await tx.admissionRegistrationSettings.update({
        where: { id: settings.id },
        data: { nextSequence: { increment: 1 } },
      });
      const modifier =
        allocatedOffering.schoolClass?.registrationNumberModifier ??
        allocatedOffering.course?.registrationNumberModifier ??
        'GEN';
      const registrationNumber = `${settings.prefix}-${modifier}-${String(settings.nextSequence).padStart(settings.sequencePadding, '0')}`;
      const approved = await tx.admissionApplication.update({
        where: { id },
        data: {
          branchId: allocatedOffering.branchId,
          academicOfferingId: allocatedOffering.id,
          status: AdmissionStatus.APPROVED,
          reviewNote: dto.reviewNote?.trim(),
          reviewedAt: new Date(),
          reviewedByUserId: actorUserId,
          physicalDocumentsVerifiedAt: dto.physicalDocumentsVerified
            ? new Date()
            : null,
          physicalDocumentsVerificationNote:
            dto.physicalDocumentsVerificationNote?.trim(),
        },
        include: this.applicationInclude,
      });
      const officer = await tx.user.findUnique({
        where: { id: actorUserId },
        select: { fullName: true },
      });
      const student = await tx.student.create({
        data: {
          admissionApplicationId: approved.id,
          guardianPortalUserId: portalUser.id,
          branchId: approved.branchId,
          academicOfferingId: approved.academicOfferingId,
          academicTermId: academicTerm.id,
          registrationNumber,
          monthlyFeeAmount: dto.monthlyFeeAmount,
          amountReceivedWithForm: dto.amountReceivedWithForm,
          openingBalanceAmount: dto.openingBalanceAmount,
          receiptNumber: dto.receiptNumber?.trim(),
          balanceDueOn: dto.balanceDueOn
            ? new Date(dto.balanceDueOn)
            : undefined,
          admissionRemarks: dto.reviewNote?.trim(),
          admissionOfficerName: officer?.fullName,
          studentFullName: approved.studentFullName,
          studentCnic: approved.studentCnic,
          guardianFullName: approved.guardianFullName,
          guardianContactNumber: approved.guardianContactNumber,
          previousSchool: approved.previousSchool,
          previousPerformance: approved.previousPerformance,
        },
      });
      return { application: approved, student, credentials };
    });
    await this.audit(
      actorUserId,
      AuditAction.UPDATE,
      'AdmissionApplication',
      id,
      { ...dto, action: 'APPROVE' },
    );
    return outcome;
  }

  async deleteRejected(id: string, actorUserId: string) {
    const application = await this.application(id);
    await this.ensureBranchAccess(actorUserId, application.branchId);
    if (application.status !== AdmissionStatus.REJECTED)
      throw new BadRequestException(
        'Only rejected applications can be deleted',
      );
    await this.prisma.admissionApplication.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit(
      actorUserId,
      AuditAction.DELETE,
      'AdmissionApplication',
      id,
    );
  }

  async learnerStudents(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, accountType: AccountType.LEARNER, deletedAt: null },
    });
    if (!user)
      throw new ForbiddenException('Learner portal access is required');
    return this.prisma.student.findMany({
      where: { guardianPortalUserId: user.id, deletedAt: null },
      include: {
        academicTerm: true,
        academicOffering: {
          include: {
            schoolClass: true,
            course: true,
            academicGroup: true,
            branch: true,
          },
        },
        admissionApplication: {
          select: { id: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async learnerStudentAttendance(
    userId: string,
    studentId: string,
    from?: string,
    to?: string,
  ) {
    const student = await this.learnerStudent(userId, studentId);
    const dateFilter =
      from && to
        ? { attendanceDate: { gte: this.date(from), lte: this.date(to) } }
        : {};
    return this.prisma.studentAttendance.findMany({
      where: { studentId: student.id, ...dateFilter },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async learnerStudentPerformance(userId: string, studentId: string) {
    const student = await this.learnerStudent(userId, studentId);
    const marks = await this.prisma.studentAssessmentMark.findMany({
      where: { studentId: student.id },
      include: { assessment: true, subject: true },
      orderBy: { assessment: { heldOn: 'desc' } },
    });
    return marks.map((mark) => ({
      ...mark,
      percentage:
        (Number(mark.obtainedMarks) * 100) / Number(mark.maximumMarks),
    }));
  }

  async learnerStudentFinance(userId: string, studentId: string) {
    await this.learnerStudent(userId, studentId);
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        payments: true,
        academicTerm: true,
        academicOffering: {
          include: {
            schoolClass: true,
            course: true,
            academicGroup: true,
            branch: true,
          },
        },
      },
    });
    const paid = student.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      Number(student.amountReceivedWithForm ?? 0),
    );
    return {
      student,
      paid,
      balance: Number(student.openingBalanceAmount ?? 0) - paid,
    };
  }

  private readonly applicationInclude = {
    branch: true,
    academicOffering: { include: { schoolClass: true, course: true } },
    student: true,
  } satisfies Prisma.AdmissionApplicationInclude;
  private readonly studentInclude = {
    branch: true,
    academicTerm: true,
    academicOffering: {
      include: { schoolClass: true, course: true, academicGroup: true },
    },
    admissionApplication: {
      select: { id: true, status: true, createdAt: true, formData: true },
    },
  } satisfies Prisma.StudentInclude;
  private async organization() {
    const organization = await this.prisma.organization.findFirst();
    if (!organization)
      throw new NotFoundException('Organization has not been configured');
    return organization;
  }
  private async activeOffering(id: string) {
    const offering = await this.prisma.academicOffering.findFirst({
      where: { id, status: 'ACTIVE', branch: { deletedAt: null } },
      include: { schoolClass: true, course: true },
    });
    if (!offering) throw new NotFoundException('Academic offering not found');
    return offering;
  }
  private async offeringForImport(row: BulkStudentImportRowDto) {
    const offerings = await this.prisma.academicOffering.findMany({
      where: { status: 'ACTIVE', branch: { deletedAt: null } },
      include: { branch: true, schoolClass: true, course: true },
    });
    const normalize = (value: string | null | undefined) =>
      (value ?? '').trim().toLocaleLowerCase();
    const matches = offerings.filter(
      (offering) =>
        normalize(offering.branch.name) === normalize(row.campusName) &&
        normalize(offering.schoolClass?.name ?? offering.course?.name) ===
          normalize(row.classOrCourse) &&
        (!row.sectionName ||
          normalize(offering.sectionName) === normalize(row.sectionName)),
    );
    const fallbackMatches = offerings.filter(
      (offering) =>
        normalize(offering.schoolClass?.name ?? offering.course?.name) ===
          normalize(row.classOrCourse) &&
        (!row.sectionName ||
          normalize(offering.sectionName) === normalize(row.sectionName)),
    );
    const resolved = matches.length === 1 ? matches : fallbackMatches;
    if (resolved.length !== 1)
      throw new NotFoundException(
        resolved.length === 0
          ? `No active offering found for ${row.campusName} / ${row.classOrCourse}`
          : `Multiple offerings match ${row.classOrCourse}; use the exact campus_name and section_name`,
      );
    return resolved[0]!;
  }
  private async application(id: string) {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id, deletedAt: null },
      include: this.applicationInclude,
    });
    if (!application)
      throw new NotFoundException('Admission application not found');
    return application;
  }
  private async learnerStudent(
    userId: string,
    studentId: string,
    include?: Prisma.StudentInclude,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, accountType: AccountType.LEARNER, deletedAt: null },
    });
    if (!user)
      throw new ForbiddenException('Learner portal access is required');
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, guardianPortalUserId: user.id, deletedAt: null },
      include,
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }
  private date(value: string) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  private async accessibleBranchIds(userId: string): Promise<string[] | null> {
    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId },
      select: { branchId: true },
    });
    if (assignments.some((assignment) => assignment.branchId === null))
      return null;
    return assignments.flatMap((assignment) =>
      assignment.branchId ? [assignment.branchId] : [],
    );
  }
  private async ensureBranchAccess(userId: string, branchId: string) {
    const accessible = await this.accessibleBranchIds(userId);
    if (accessible && !accessible.includes(branchId))
      throw new ForbiddenException('You do not have access to this branch');
  }
  private generatePassword() {
    return Array.from(
      { length: 10 },
      () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)],
    ).join('');
  }
  private rethrowUnique(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException(
        'An admission already exists for this student CNIC in the selected academic offering',
      );
    throw error;
  }
  private async audit(
    actorUserId: string | undefined,
    action: AuditAction,
    entityType: string,
    entityId: string,
    changes?: object,
  ) {
    const organization = await this.organization();
    await this.auditService.record({
      organizationId: organization.id,
      actorUserId,
      action,
      entityType,
      entityId,
      changes: changes as unknown as Prisma.InputJsonValue | undefined,
    });
  }
}
