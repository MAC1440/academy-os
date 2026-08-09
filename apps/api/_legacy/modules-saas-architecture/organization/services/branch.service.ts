import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { BranchListQueryDto } from '../dto/branch-list-query.dto';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';

@Injectable()
export class BranchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    const academy = await this.prisma.academy.findUnique({
      where: { id: dto.academyId },
    });

    if (!academy) {
      throw new BadRequestException('Academy not found');
    }

    return this.prisma.branch.create({
      data: {
        academyId: dto.academyId,
        name: dto.name.trim(),
        address: dto.address?.trim(),
        city: dto.city?.trim(),
        country: dto.country?.trim(),
        phone: dto.phone?.trim(),
        email: dto.email?.trim(),
        status: dto.status,
      },
    });
  }

  async findAll(query: BranchListQueryDto, branchIds: string[] | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.BranchWhereInput = {
      ...(branchIds ? { id: { in: branchIds } } : {}),
      ...(query.academyId ? { academyId: query.academyId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { country: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.branch.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { academy: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.branch.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { academy: { select: { id: true, name: true, slug: true } } },
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    await this.findOne(id);

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.address !== undefined
          ? { address: dto.address?.trim() ?? null }
          : {}),
        ...(dto.city !== undefined ? { city: dto.city?.trim() ?? null } : {}),
        ...(dto.country !== undefined
          ? { country: dto.country?.trim() ?? null }
          : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone?.trim() ?? null }
          : {}),
        ...(dto.email !== undefined
          ? { email: dto.email?.trim() ?? null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.branch.delete({ where: { id } });
    return { id };
  }
}
