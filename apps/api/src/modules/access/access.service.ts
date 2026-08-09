import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async permissionsForUser(userId: string): Promise<Set<string>> {
    const assignments = await this.prisma.roleAssignment.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            permissions: {
              select: { permission: { select: { key: true } } },
            },
          },
        },
      },
    });

    return new Set(
      assignments.flatMap((assignment) =>
        assignment.role.permissions.map(({ permission }) => permission.key),
      ),
    );
  }

  async canAccessBranch(userId: string, branchId: string): Promise<boolean> {
    const assignment = await this.prisma.roleAssignment.findFirst({
      where: { userId, OR: [{ branchId: null }, { branchId }] },
      select: { id: true },
    });
    return Boolean(assignment);
  }
}
