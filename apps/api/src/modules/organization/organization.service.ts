import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, EntityStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateBranchOperatingHourDto, UpdateBranchOperatingHourDto } from './dto/branch-operating-hours.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getOrganization() {
    const organization = await this.prisma.organization.findFirst();
    if (!organization) throw new NotFoundException('Organization has not been configured');
    return organization;
  }

  async updateOrganization(dto: UpdateOrganizationDto, actorUserId: string) {
    const organization = await this.getOrganization();
    const updated = await this.prisma.organization.update({
      where: { id: organization.id },
      data: this.cleanOptionalFields(dto),
    });
    await this.auditService.record({
      organizationId: organization.id,
      actorUserId,
      action: AuditAction.UPDATE,
      entityType: 'Organization',
      entityId: organization.id,
      changes: dto as unknown as Prisma.InputJsonValue,
    });
    return updated;
  }

  async listBranches(userId: string) {
    const branchIds = await this.accessibleBranchIds(userId);
    return this.prisma.branch.findMany({
      where: {
        deletedAt: null,
        ...(branchIds ? { id: { in: branchIds } } : {}),
      },
      include: { operatingHours: { where: { status: EntityStatus.ACTIVE } } },
      orderBy: { name: 'asc' },
    });
  }

  async getBranch(branchId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, deletedAt: null },
      include: { operatingHours: { orderBy: { label: 'asc' } } },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async createBranch(dto: CreateBranchDto, actorUserId: string) {
    const organization = await this.getOrganization();
    const addressKey = this.addressKey(dto.address);
    try {
      const branch = await this.prisma.branch.create({
        data: {
          organizationId: organization.id,
          name: dto.name.trim(),
          address: dto.address.trim(),
          addressKey,
          city: dto.city?.trim(),
          phone: dto.phone?.trim(),
        },
      });
      await this.auditService.record({
        organizationId: organization.id,
        actorUserId,
        action: AuditAction.CREATE,
        entityType: 'Branch',
        entityId: branch.id,
        changes: dto as unknown as Prisma.InputJsonValue,
      });
      return branch;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A branch already exists at this address');
      }
      throw error;
    }
  }

  async updateBranch(branchId: string, dto: UpdateBranchDto, actorUserId: string) {
    const existing = await this.getBranch(branchId);
    const data = this.cleanOptionalFields(dto) as Prisma.BranchUpdateInput;
    if (dto.address !== undefined) {
      data.addressKey = this.addressKey(dto.address);
    }
    if (dto.status === EntityStatus.ARCHIVED) data.deletedAt = new Date();
    if (dto.status && dto.status !== EntityStatus.ARCHIVED) data.deletedAt = null;

    try {
      const branch = await this.prisma.branch.update({ where: { id: existing.id }, data });
      const organization = await this.getOrganization();
      await this.auditService.record({
        organizationId: organization.id,
        actorUserId,
        action: AuditAction.UPDATE,
        entityType: 'Branch',
        entityId: branch.id,
        changes: dto as unknown as Prisma.InputJsonValue,
      });
      return branch;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('A branch already exists at this address');
      }
      throw error;
    }
  }

  async listOperatingHours(branchId: string) {
    await this.getBranch(branchId);
    return this.prisma.branchOperatingHour.findMany({ where: { branchId }, orderBy: { label: 'asc' } });
  }

  async createOperatingHour(branchId: string, dto: CreateBranchOperatingHourDto, actorUserId: string) {
    const branch = await this.getBranch(branchId);
    try {
      const operatingHour = await this.prisma.branchOperatingHour.create({
        data: { branchId, label: dto.label.trim(), opensAt: dto.opensAt, closesAt: dto.closesAt },
      });
      await this.auditService.record({
        organizationId: branch.organizationId,
        actorUserId,
        action: AuditAction.CREATE,
        entityType: 'BranchOperatingHour',
        entityId: operatingHour.id,
        changes: dto as unknown as Prisma.InputJsonValue,
      });
      return operatingHour;
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Operating-hour labels must be unique within a branch');
      throw error;
    }
  }

  async updateOperatingHour(branchId: string, operatingHourId: string, dto: UpdateBranchOperatingHourDto, actorUserId: string) {
    const branch = await this.getBranch(branchId);
    const operatingHour = await this.prisma.branchOperatingHour.findFirst({ where: { id: operatingHourId, branchId } });
    if (!operatingHour) throw new NotFoundException('Branch operating hours not found');
    try {
      const updated = await this.prisma.branchOperatingHour.update({
        where: { id: operatingHour.id },
        data: this.cleanOptionalFields(dto),
      });
      await this.auditService.record({
        organizationId: branch.organizationId,
        actorUserId,
        action: AuditAction.UPDATE,
        entityType: 'BranchOperatingHour',
        entityId: updated.id,
        changes: dto as unknown as Prisma.InputJsonValue,
      });
      return updated;
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Operating-hour labels must be unique within a branch');
      throw error;
    }
  }

  private async accessibleBranchIds(userId: string): Promise<string[] | null> {
    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId },
      select: { branchId: true },
    });
    if (assignments.some((assignment) => assignment.branchId === null)) return null;
    return assignments.flatMap((assignment) => (assignment.branchId ? [assignment.branchId] : []));
  }

  private cleanOptionalFields<T extends object>(input: T): T {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ]),
    ) as T;
  }

  private addressKey(address: string) {
    return address.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  }

  private isUniqueViolation(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
