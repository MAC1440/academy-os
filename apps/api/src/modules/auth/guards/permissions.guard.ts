import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';
import { REQUIRED_PERMISSIONS } from '../decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const permissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [context.getHandler(), context.getClass()]);
    if (!permissions?.length) return true;
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser; params: Record<string, string>; body?: { academyId?: string; branchId?: string } }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Authentication is required');
    if (user.isPlatformAdmin) return true;
    const academyId = request.params.academyId ?? request.body?.academyId;
    if (!academyId) throw new ForbiddenException('Organization context is required');
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { userId: user.id, academyId, status: 'ACTIVE', deletedAt: null },
      include: { roleAssignments: { include: { role: { include: { permissions: { include: { permission: { select: { key: true } } } } } } } } },
    });
    if (!membership) throw new ForbiddenException('Organization membership is required');
    if (membership.isOwner) return true;
    const granted = new Set(membership.roleAssignments.flatMap((assignment) => assignment.role.permissions.map(({ permission }) => permission.key)));
    if (permissions.every((permission) => granted.has(permission))) return true;
    throw new ForbiddenException('You do not have permission for this action');
  }
}
