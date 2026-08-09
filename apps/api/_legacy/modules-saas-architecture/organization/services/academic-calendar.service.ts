import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAcademicYearDto } from '../dto/create-academic-year.dto';
import { CreateCalendarDayDto } from '../dto/create-calendar-day.dto';

@Injectable()
export class AcademicCalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(academyId: string) {
    const [academicYears, workingDays, calendarDays] = await Promise.all([
      this.prisma.academicYear.findMany({
        where: { academyId },
        orderBy: { startsOn: 'desc' },
      }),
      this.prisma.organizationWorkingDay.findMany({
        where: { academyId },
        orderBy: { weekday: 'asc' },
      }),
      this.prisma.academicCalendarDay.findMany({
        where: { academyId },
        orderBy: { date: 'asc' },
      }),
    ]);
    return {
      academicYears,
      weekdays: workingDays.map((day) => day.weekday),
      calendarDays,
    };
  }

  async createYear(academyId: string, dto: CreateAcademicYearDto) {
    const startsOn = new Date(dto.startsOn);
    const endsOn = new Date(dto.endsOn);
    if (startsOn >= endsOn)
      throw new BadRequestException(
        'The academic year end date must be after its start date',
      );
    try {
      return await this.prisma.academicYear.create({
        data: {
          academyId,
          name: dto.name.trim(),
          startsOn,
          endsOn,
          status: dto.status,
        },
      });
    } catch (error) {
      if (this.isUniqueConstraint(error))
        throw new ConflictException(
          'An academic year with this name already exists',
        );
      throw error;
    }
  }

  async replaceWorkingDays(academyId: string, weekdays: number[]) {
    await this.prisma.$transaction([
      this.prisma.organizationWorkingDay.deleteMany({ where: { academyId } }),
      this.prisma.organizationWorkingDay.createMany({
        data: weekdays.map((weekday) => ({ academyId, weekday })),
      }),
    ]);
    return { weekdays: [...weekdays].sort((a, b) => a - b) };
  }

  async addCalendarDay(academyId: string, dto: CreateCalendarDayDto) {
    const date = this.calendarDate(dto.date);
    try {
      return await this.prisma.academicCalendarDay.create({
        data: { academyId, date, type: dto.type, label: dto.label.trim() },
      });
    } catch (error) {
      if (this.isUniqueConstraint(error))
        throw new ConflictException(
          'A holiday or off day is already configured for this date',
        );
      throw error;
    }
  }

  async removeCalendarDay(academyId: string, id: string) {
    const calendarDay = await this.prisma.academicCalendarDay.findFirst({
      where: { id, academyId },
      select: { id: true },
    });
    if (!calendarDay) throw new NotFoundException('Calendar day not found');
    await this.prisma.academicCalendarDay.delete({ where: { id } });
    return { id };
  }

  private calendarDate(value: string) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()))
      throw new BadRequestException('Invalid calendar date');
    return date;
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
