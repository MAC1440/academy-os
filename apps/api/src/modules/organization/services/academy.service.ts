import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAcademyDto } from '../dto/create-academy.dto';
import { ListQueryDto } from '../dto/list-query.dto';
import { UpdateAcademyDto } from '../dto/update-academy.dto';
import { slugify, uniqueSlug } from '../utils/slug.util';

@Injectable()
export class AcademyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAcademyDto) {
    const slug =
      dto.slug?.trim() ||
      (await uniqueSlug(dto.name, async (candidate) =>
        Boolean(
          await this.prisma.academy.findUnique({ where: { slug: candidate } }),
        ),
      ));

    if (dto.slug) {
      const existing = await this.prisma.academy.findUnique({
        where: { slug: slugify(slug) },
      });
      if (existing) {
        throw new ConflictException('Academy slug already exists');
      }
    }

    return this.prisma.academy.create({
      data: {
        name: dto.name.trim(),
        slug: slugify(slug),
        email: dto.email?.trim(),
        phone: dto.phone?.trim(),
        website: dto.website?.trim(),
        logo: dto.logo?.trim(),
        timezone: dto.timezone?.trim() ?? 'UTC',
        currency: dto.currency?.trim()?.toUpperCase() ?? 'USD',
        status: dto.status,
      },
    });
  }

  async findAll(query: ListQueryDto, academyIds: string[] | null) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.AcademyWhereInput = {
      ...(academyIds ? { id: { in: academyIds } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.academy.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { branches: true } } },
      }),
      this.prisma.academy.count({ where }),
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
    const academy = await this.prisma.academy.findUnique({
      where: { id },
      include: {
        branches: { orderBy: { createdAt: 'asc' } },
        _count: { select: { branches: true } },
      },
    });

    if (!academy) {
      throw new NotFoundException('Academy not found');
    }

    return academy;
  }

  async update(id: string, dto: UpdateAcademyDto) {
    await this.findOne(id);

    if (dto.slug) {
      const normalized = slugify(dto.slug);
      const existing = await this.prisma.academy.findFirst({
        where: { slug: normalized, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Academy slug already exists');
      }
    }

    return this.prisma.academy.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.slug !== undefined ? { slug: slugify(dto.slug) } : {}),
        ...(dto.email !== undefined
          ? { email: dto.email?.trim() ?? null }
          : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone?.trim() ?? null }
          : {}),
        ...(dto.website !== undefined
          ? { website: dto.website?.trim() ?? null }
          : {}),
        ...(dto.logo !== undefined ? { logo: dto.logo?.trim() ?? null } : {}),
        ...(dto.timezone !== undefined
          ? { timezone: dto.timezone.trim() }
          : {}),
        ...(dto.currency !== undefined
          ? { currency: dto.currency.trim().toUpperCase() }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.academy.delete({ where: { id } });
    return { id };
  }
}
