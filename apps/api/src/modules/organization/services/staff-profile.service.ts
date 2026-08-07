import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateStaffProfileDto } from '../dto/create-staff-profile.dto';

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
}
