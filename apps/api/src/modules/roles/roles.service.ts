import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  async listRoles() {
    const organization = await this.organization();
    return this.prisma.role.findMany({
      where: { organizationId: organization.id },
      include: { permissions: { include: { permission: true } }, _count: { select: { assignments: true } } },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async createRole(dto: CreateRoleDto, actorUserId: string) {
    const organization = await this.organization();
    const permissions = await this.permissionsByKey(dto.permissionKeys);
    try {
      const role = await this.prisma.role.create({
        data: {
          organizationId: organization.id,
          name: dto.name.trim(),
          permissions: { create: permissions.map((permission) => ({ permissionId: permission.id })) },
        },
        include: { permissions: { include: { permission: true } } },
      });
      await this.audit(actorUserId, AuditAction.CREATE, 'Role', role.id, dto);
      return role;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A role with this name already exists');
      }
      throw error;
    }
  }

  async updateRole(roleId: string, dto: UpdateRoleDto, actorUserId: string) {
    const role = await this.role(roleId);
    if (role.isSystem) throw new BadRequestException('System roles cannot be changed');
    const permissions = dto.permissionKeys ? await this.permissionsByKey(dto.permissionKeys) : undefined;
    try {
      const updated = await this.prisma.role.update({
        where: { id: role.id },
        data: {
          ...(dto.name ? { name: dto.name.trim() } : {}),
          ...(permissions
            ? {
                permissions: {
                  deleteMany: {},
                  create: permissions.map((permission) => ({ permissionId: permission.id })),
                },
              }
            : {}),
        },
        include: { permissions: { include: { permission: true } } },
      });
      await this.audit(actorUserId, AuditAction.UPDATE, 'Role', role.id, dto);
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A role with this name already exists');
      }
      throw error;
    }
  }

  async assignRole(dto: AssignRoleDto, actorUserId: string) {
    const role = await this.role(dto.roleId);
    const user = await this.prisma.user.findFirst({ where: { id: dto.userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({ where: { id: dto.branchId, deletedAt: null } });
      if (!branch) throw new NotFoundException('Branch not found');
    }
    try {
      const assignment = await this.prisma.roleAssignment.create({ data: dto });
      await this.audit(actorUserId, AuditAction.CREATE, 'RoleAssignment', assignment.id, dto);
      return assignment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This role is already assigned at this scope');
      }
      throw error;
    }
  }

  async removeAssignment(assignmentId: string, actorUserId: string) {
    const assignment = await this.prisma.roleAssignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Role assignment not found');
    await this.prisma.roleAssignment.delete({ where: { id: assignment.id } });
    await this.audit(actorUserId, AuditAction.DELETE, 'RoleAssignment', assignment.id);
  }

  private async organization() {
    const organization = await this.prisma.organization.findFirst();
    if (!organization) throw new NotFoundException('Organization has not been configured');
    return organization;
  }

  private async role(roleId: string) {
    const organization = await this.organization();
    const role = await this.prisma.role.findFirst({ where: { id: roleId, organizationId: organization.id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  private async permissionsByKey(keys: string[]) {
    const permissions = await this.prisma.permission.findMany({ where: { key: { in: keys } } });
    if (permissions.length !== keys.length) throw new BadRequestException('One or more permission keys are invalid');
    return permissions;
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
      changes: changes as Prisma.InputJsonValue | undefined,
    });
  }
}
