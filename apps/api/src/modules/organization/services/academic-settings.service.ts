import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateAcademicSettingsDto } from '../dto/update-academic-settings.dto';

@Injectable()
export class AcademicSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  findOrCreate(academyId: string) {
    return this.prisma.academicSettings.upsert({
      where: { academyId },
      create: { academyId },
      update: {},
    });
  }

  async update(academyId: string, dto: UpdateAcademicSettingsDto) {
    await this.findOrCreate(academyId);
    return this.prisma.academicSettings.update({
      where: { academyId },
      data: { sectionsEnabled: dto.sectionsEnabled },
    });
  }
}
