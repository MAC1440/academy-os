import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const memberInclude = {
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      status: true,
    },
  },
  branchAssignments: {
    where: { deletedAt: null },
    include: { branch: { select: { id: true, name: true, status: true } } },
    orderBy: { branch: { name: 'asc' as const } },
  },
};

@Injectable()
export class MembershipService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(academyId: string) {
    return this.prisma.organizationMembership.findMany({
      where: { academyId, deletedAt: null },
      include: memberInclude,
      orderBy: [{ isOwner: 'desc' }, { user: { firstName: 'asc' } }],
    });
  }

  async add(academyId: string, email: string, branchIds: string[] = []) {
    const user = await this.prisma.user.findFirst({
      where: { email, status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    if (!user)
      throw new NotFoundException('Active user not found for this email');

    const membership = await this.prisma.organizationMembership.upsert({
      where: { userId_academyId: { userId: user.id, academyId } },
      create: { userId: user.id, academyId, status: 'ACTIVE' },
      update: { status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });
    await this.replaceBranches(academyId, membership.id, branchIds);
    return this.findOne(academyId, membership.id);
  }

  async updateBranches(
    academyId: string,
    membershipId: string,
    branchIds: string[],
  ) {
    const membership = await this.getMembership(academyId, membershipId);
    await this.replaceBranches(academyId, membership.id, branchIds);
    return this.findOne(academyId, membership.id);
  }

  async findOne(academyId: string, membershipId: string) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { id: membershipId, academyId, deletedAt: null },
      include: memberInclude,
    });
    if (!membership)
      throw new NotFoundException('Organization member not found');
    return membership;
  }

  private async getMembership(academyId: string, membershipId: string) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: { id: membershipId, academyId, deletedAt: null },
      select: { id: true },
    });
    if (!membership)
      throw new NotFoundException('Organization member not found');
    return membership;
  }

  private async replaceBranches(
    academyId: string,
    membershipId: string,
    branchIds: string[],
  ) {
    const branches = branchIds.length
      ? await this.prisma.branch.findMany({
          where: { id: { in: branchIds }, academyId },
          select: { id: true },
        })
      : [];
    if (branches.length !== branchIds.length) {
      throw new NotFoundException(
        'One or more branches do not belong to this organization',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.branchAssignment.updateMany({
        where: {
          membershipId,
          deletedAt: null,
          ...(branchIds.length ? { branchId: { notIn: branchIds } } : {}),
        },
        data: { deletedAt: new Date() },
      });
      await Promise.all(
        branchIds.map((branchId) =>
          tx.branchAssignment.upsert({
            where: { membershipId_branchId: { membershipId, branchId } },
            create: { membershipId, branchId },
            update: { deletedAt: null },
          }),
        ),
      );
    });
  }
}
