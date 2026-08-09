import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateClassSectionDto } from '../dto/create-class-section.dto';
import { CreateSchoolClassDto } from '../dto/create-school-class.dto';
import { UpdateSchoolClassDto } from '../dto/update-school-class.dto';

const classInclude = { sections: { orderBy: [{ name: 'asc' as const }] } };

@Injectable()
export class SchoolClassService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(branchId: string) {
    return this.prisma.schoolClass.findMany({
      where: { branchId },
      include: classInclude,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id },
      include: {
        ...classInclude,
        branch: { select: { id: true, academyId: true } },
      },
    });
    if (!schoolClass) throw new NotFoundException('School class not found');
    return schoolClass;
  }

  async create(branchId: string, dto: CreateSchoolClassDto) {
    try {
      return await this.prisma.schoolClass.create({
        data: {
          branchId,
          name: dto.name.trim(),
          code: dto.code.trim().toUpperCase(),
          sortOrder: dto.sortOrder ?? 0,
          status: dto.status,
        },
        include: classInclude,
      });
    } catch (error) {
      if (this.isUniqueConstraint(error))
        throw new ConflictException(
          'A class with this code already exists in the branch',
        );
      throw error;
    }
  }

  async update(id: string, dto: UpdateSchoolClassDto) {
    await this.findOne(id);
    try {
      return await this.prisma.schoolClass.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.code !== undefined
            ? { code: dto.code.trim().toUpperCase() }
            : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: classInclude,
      });
    } catch (error) {
      if (this.isUniqueConstraint(error))
        throw new ConflictException(
          'A class with this code already exists in the branch',
        );
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.schoolClass.delete({ where: { id } });
    return { id };
  }

  async addSection(id: string, dto: CreateClassSectionDto) {
    const schoolClass = await this.findOne(id);
    const settings = await this.prisma.academicSettings.findUnique({
      where: { academyId: schoolClass.branch.academyId },
      select: { sectionsEnabled: true },
    });
    if (!settings?.sectionsEnabled)
      throw new BadRequestException(
        'Enable sections for this organization before adding a section',
      );
    try {
      return await this.prisma.classSection.create({
        data: {
          schoolClassId: id,
          name: dto.name.trim(),
          code: dto.code.trim().toUpperCase(),
          status: dto.status,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraint(error))
        throw new ConflictException(
          'A section with this code already exists in this class',
        );
      throw error;
    }
  }

  private isUniqueConstraint(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
