import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStaffProfileDto } from '../dto/create-staff-profile.dto';
import { ResetStaffPinDto } from '../dto/reset-staff-pin.dto';
import { UpdateStaffProfileDto } from '../dto/update-staff-profile.dto';

const staffInclude = {
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
  branchAssignments: {
    include: { branch: { select: { id: true, name: true } } },
  },
};

@Injectable()
export class StaffProfileService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(academyId: string) {
    return this.prisma.staffProfile.findMany({
      where: { academyId },
      include: staffInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(academyId: string, dto: CreateStaffProfileDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!user)
      throw new NotFoundException('Active user not found for this email');
    const branches = await this.prisma.branch.findMany({
      where: { academyId, id: { in: dto.branchIds } },
      select: { id: true },
    });
    if (branches.length !== dto.branchIds.length)
      throw new NotFoundException(
        'One or more branches do not belong to this organization',
      );
    const pinHash = await bcrypt.hash(dto.pin, 12);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const membership = await tx.organizationMembership.upsert({
          where: { userId_academyId: { userId: user.id, academyId } },
          create: { userId: user.id, academyId },
          update: { status: 'ACTIVE', deletedAt: null },
          select: { id: true },
        });
        await Promise.all(
          dto.branchIds.map((branchId) =>
            tx.branchAssignment.upsert({
              where: {
                membershipId_branchId: {
                  membershipId: membership.id,
                  branchId,
                },
              },
              create: { membershipId: membership.id, branchId },
              update: { deletedAt: null },
            }),
          ),
        );
        return tx.staffProfile.create({
          data: {
            academyId,
            userId: user.id,
            type: dto.type,
            employeeCode: dto.employeeCode?.trim(),
            pinHash,
            branchAssignments: {
              create: dto.branchIds.map((branchId) => ({ branchId })),
            },
          },
          include: staffInclude,
        });
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'This user already has a staff profile in this organization',
        );
      throw error;
    }
  }

  async update(academyId: string, id: string, dto: UpdateStaffProfileDto) {
    const profile = await this.prisma.staffProfile.findFirst({
      where: { id, academyId },
      select: { id: true, userId: true },
    });
    if (!profile) throw new NotFoundException('Staff profile not found');
    if (dto.branchIds) {
      const branches = await this.prisma.branch.findMany({
        where: { academyId, id: { in: dto.branchIds } },
        select: { id: true },
      });
      if (branches.length !== dto.branchIds.length)
        throw new NotFoundException(
          'One or more branches do not belong to this organization',
        );
      await this.prisma.$transaction(async (tx) => {
        await tx.staffBranchAssignment.deleteMany({ where: { staffId: id } });
        await tx.staffBranchAssignment.createMany({
          data: dto.branchIds!.map((branchId) => ({ staffId: id, branchId })),
        });
        const membership = await tx.organizationMembership.findFirst({
          where: { userId: profile.userId, academyId, deletedAt: null },
          select: { id: true },
        });
        if (membership) {
          await tx.branchAssignment.updateMany({
            where: { membershipId: membership.id, deletedAt: null },
            data: { deletedAt: new Date() },
          });
          await Promise.all(
            dto.branchIds!.map((branchId) =>
              tx.branchAssignment.upsert({
                where: {
                  membershipId_branchId: {
                    membershipId: membership.id,
                    branchId,
                  },
                },
                create: { membershipId: membership.id, branchId },
                update: { deletedAt: null },
              }),
            ),
          );
        }
      });
    }
    return this.prisma.staffProfile.update({
      where: { id },
      data: dto.status ? { status: dto.status } : {},
      include: staffInclude,
    });
  }

  async resetPin(academyId: string, id: string, dto: ResetStaffPinDto) {
    const profile = await this.prisma.staffProfile.findFirst({
      where: { id, academyId },
      select: { id: true },
    });
    if (!profile) throw new NotFoundException('Staff profile not found');
    return this.prisma.staffProfile.update({
      where: { id },
      data: { pinHash: await bcrypt.hash(dto.pin, 12) },
      include: staffInclude,
    });
  }
}
