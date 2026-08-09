import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

@Injectable()
export class TenantAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccessibleAcademyIds(user: AuthenticatedUser) {
    if (user.isPlatformAdmin) return null;
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId: user.id, status: 'ACTIVE', deletedAt: null },
      select: { academyId: true },
    });
    return memberships.map((membership) => membership.academyId);
  }

  async getAccessibleBranchIds(user: AuthenticatedUser) {
    if (user.isPlatformAdmin) return null;
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId: user.id, status: 'ACTIVE', deletedAt: null },
      select: {
        academyId: true,
        isOwner: true,
        branchAssignments: {
          where: { deletedAt: null },
          select: { branchId: true },
        },
      },
    });
    const ownerAcademyIds = memberships
      .filter((membership) => membership.isOwner)
      .map((membership) => membership.academyId);
    const assignedBranchIds = memberships.flatMap((membership) =>
      membership.branchAssignments.map((assignment) => assignment.branchId),
    );
    const ownerBranchIds = ownerAcademyIds.length
      ? await this.prisma.branch.findMany({
          where: { academyId: { in: ownerAcademyIds } },
          select: { id: true },
        })
      : [];
    return [
      ...new Set([
        ...assignedBranchIds,
        ...ownerBranchIds.map((branch) => branch.id),
      ]),
    ];
  }

  async assertAcademyAccess(
    user: AuthenticatedUser,
    academyId: string,
    ownerRequired = false,
  ) {
    if (user.isPlatformAdmin) return;
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { userId: user.id, academyId, status: 'ACTIVE', deletedAt: null },
      select: { isOwner: true },
    });
    if (!membership) throw new NotFoundException('Organization not found');
    if (ownerRequired && !membership.isOwner)
      throw new ForbiddenException('Organization owner access is required');
  }

  async assertBranchAccess(
    user: AuthenticatedUser,
    branchId: string,
    ownerRequired = false,
  ) {
    if (user.isPlatformAdmin) return;
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { academyId: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        userId: user.id,
        academyId: branch.academyId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        isOwner: true,
        branchAssignments: {
          where: { branchId, deletedAt: null },
          select: { id: true },
        },
      },
    });
    if (
      !membership ||
      (!membership.isOwner && membership.branchAssignments.length === 0)
    )
      throw new NotFoundException('Branch not found');
    if (ownerRequired && !membership.isOwner)
      throw new ForbiddenException('Organization owner access is required');
  }
}
