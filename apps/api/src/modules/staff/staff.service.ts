import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccountStatus,
  AccountType,
  AuditAction,
  Prisma,
  StaffType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import {
  decryptTemporaryCredential,
  encryptTemporaryCredential,
} from '../../common/temporary-credential-vault';
import { jwtSecret } from '../../config/environment';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

const PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listStaff(requesterUserId: string) {
    const branchIds = await this.accessibleBranchIds(requesterUserId);
    return this.prisma.staffProfile.findMany({
      where: {
        user: {
          deletedAt: null,
          ...(branchIds
            ? { roleAssignments: { some: { branchId: { in: branchIds } } } }
            : {}),
        },
      },
      include: this.staffInclude,
      orderBy: { user: { fullName: 'asc' } },
    });
  }

  async getStaff(staffId: string, requesterUserId: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
      include: this.staffInclude,
    });
    if (!staff || staff.user.deletedAt)
      throw new NotFoundException('Staff member not found');
    if (!(await this.canViewStaff(staff.userId, requesterUserId))) {
      throw new NotFoundException('Staff member not found');
    }
    return staff;
  }

  async createStaff(dto: CreateStaffDto, actorUserId: string) {
    const organization = await this.organization();
    await this.verifyBranches(dto.branchIds);
    const role = await this.roleFor(
      dto.roleId,
      dto.staffType ?? StaffType.TEACHER,
      organization.id,
    );
    const initialPassword = this.generatePassword();
    const initialPin = String(randomInt(1000, 10_000));
    try {
      const staff = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            accountType: AccountType.STAFF,
            contactNumber: dto.contactNumber.trim(),
            fullName: dto.fullName.trim(),
            email: dto.email?.trim(),
            passwordHash: await bcrypt.hash(initialPassword, 12),
            pinHash: await bcrypt.hash(initialPin, 12),
            temporaryPasswordEncrypted: encryptTemporaryCredential(
              initialPassword,
              jwtSecret,
            ),
            temporaryPinEncrypted: encryptTemporaryCredential(
              initialPin,
              jwtSecret,
            ),
            mustCompleteProfile: true,
          },
        });
        const profile = await tx.staffProfile.create({
          data: {
            userId: user.id,
            staffType: dto.staffType ?? StaffType.TEACHER,
            designation: dto.designation?.trim(),
          },
          include: this.staffInclude,
        });
        await tx.roleAssignment.createMany({
          data: dto.branchIds.map((branchId) => ({
            userId: user.id,
            roleId: role.id,
            branchId,
          })),
        });
        return profile;
      });
      await this.audit(
        actorUserId,
        AuditAction.CREATE,
        'StaffProfile',
        staff.id,
        {
          ...dto,
          initialPassword: undefined,
          initialPin: undefined,
        },
      );
      return {
        staff,
        credentials: {
          contactNumber: staff.user.contactNumber,
          initialPassword,
          initialPin,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A staff account with this contact number already exists',
        );
      }
      throw error;
    }
  }

  async updateStaff(staffId: string, dto: UpdateStaffDto, actorUserId: string) {
    const staff = await this.getStaffForManagement(staffId);
    try {
      const updated = await this.prisma.staffProfile.update({
        where: { id: staff.id },
        data: {
          ...(dto.staffType ? { staffType: dto.staffType } : {}),
          ...(dto.designation !== undefined
            ? { designation: dto.designation.trim() || null }
            : {}),
          user: {
            update: {
              ...(dto.fullName ? { fullName: dto.fullName.trim() } : {}),
              ...(dto.contactNumber
                ? { contactNumber: dto.contactNumber.trim() }
                : {}),
              ...(dto.email !== undefined
                ? { email: dto.email.trim() || null }
                : {}),
              ...(dto.status ? { status: dto.status } : {}),
            },
          },
        },
        include: this.staffInclude,
      });
      await this.audit(
        actorUserId,
        AuditAction.UPDATE,
        'StaffProfile',
        staff.id,
        dto,
      );
      return updated;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A staff account with this contact number already exists',
        );
      }
      throw error;
    }
  }

  async deleteStaff(staffId: string, actorUserId: string) {
    const staff = await this.getStaffForManagement(staffId);
    await this.prisma.user.update({
      where: { id: staff.userId },
      data: {
        deletedAt: new Date(),
        status: AccountStatus.INACTIVE,
        temporaryPasswordEncrypted: null,
        temporaryPinEncrypted: null,
      },
    });
    await this.audit(actorUserId, AuditAction.DELETE, 'StaffProfile', staff.id);
    return { staffId: staff.id };
  }

  async resetPin(staffId: string, actorUserId: string) {
    const staff = await this.getStaffForManagement(staffId);
    const initialPin = String(randomInt(1000, 10_000));
    await this.prisma.user.update({
      where: { id: staff.userId },
      data: {
        pinHash: await bcrypt.hash(initialPin, 12),
        temporaryPinEncrypted: encryptTemporaryCredential(
          initialPin,
          jwtSecret,
        ),
      },
    });
    await this.audit(actorUserId, AuditAction.UPDATE, 'StaffPin', staff.id);
    return { staffId, initialPin };
  }

  async resetPassword(staffId: string, actorUserId: string) {
    const staff = await this.getStaffForManagement(staffId);
    const initialPassword = this.generatePassword();
    await this.prisma.user.update({
      where: { id: staff.userId },
      data: {
        passwordHash: await bcrypt.hash(initialPassword, 12),
        temporaryPasswordEncrypted: encryptTemporaryCredential(
          initialPassword,
          jwtSecret,
        ),
        mustCompleteProfile: true,
      },
    });
    await this.audit(
      actorUserId,
      AuditAction.UPDATE,
      'StaffPassword',
      staff.id,
    );
    return { staffId, initialPassword };
  }

  async temporaryCredentials(staffId: string) {
    const staff = await this.getStaffForManagement(staffId);
    const user = await this.prisma.user.findUnique({
      where: { id: staff.userId },
    });
    if (!user) throw new NotFoundException('Staff member not found');
    return {
      contactNumber: user.contactNumber,
      initialPassword: user.temporaryPasswordEncrypted
        ? decryptTemporaryCredential(user.temporaryPasswordEncrypted, jwtSecret)
        : null,
      initialPin: user.temporaryPinEncrypted
        ? decryptTemporaryCredential(user.temporaryPinEncrypted, jwtSecret)
        : null,
    };
  }

  private readonly staffInclude = {
    user: {
      select: {
        id: true,
        fullName: true,
        contactNumber: true,
        email: true,
        status: true,
        deletedAt: true,
        mustCompleteProfile: true,
        roleAssignments: { include: { role: true, branch: true } },
      },
    },
  } satisfies Prisma.StaffProfileInclude;

  private async organization() {
    const organization = await this.prisma.organization.findFirst();
    if (!organization)
      throw new NotFoundException('Organization has not been configured');
    return organization;
  }

  private async roleFor(
    roleId: string | undefined,
    staffType: StaffType,
    organizationId: string,
  ) {
    if (roleId) {
      const selectedRole = await this.prisma.role.findFirst({
        where: { id: roleId, organizationId },
      });
      if (!selectedRole) throw new NotFoundException('Role not found');
      return selectedRole;
    }
    const name = staffType === StaffType.TEACHER ? 'Teacher' : 'Staff';
    const role = await this.prisma.role.findUnique({
      where: { organizationId_name: { organizationId, name } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private async verifyBranches(branchIds: string[]) {
    const count = await this.prisma.branch.count({
      where: { id: { in: branchIds }, deletedAt: null },
    });
    if (count !== branchIds.length)
      throw new NotFoundException('One or more branches were not found');
  }

  private async getStaffForManagement(staffId: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
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

  private async canViewStaff(targetUserId: string, requesterUserId: string) {
    const requesterBranches = await this.accessibleBranchIds(requesterUserId);
    if (!requesterBranches) return true;
    const targetAssignments = await this.prisma.roleAssignment.count({
      where: { userId: targetUserId, branchId: { in: requesterBranches } },
    });
    return targetAssignments > 0;
  }

  private generatePassword() {
    return Array.from(
      { length: 10 },
      () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)],
    ).join('');
  }

  private async audit(
    actorUserId: string,
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
