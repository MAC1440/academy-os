import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CalendarDayType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
class CalendarDayDto {
  @IsDateString() date!: string;
  @IsEnum(CalendarDayType) dayType!: CalendarDayType;
  @IsOptional() @IsString() label?: string;
}
@ApiTags('Academic Calendar')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('academic-calendar')
export class CalendarController {
  constructor(private readonly prisma: PrismaService) {}
  private async org() {
    const o = await this.prisma.organization.findFirst();
    if (!o) throw new Error('Organization missing');
    return o;
  }
  @Get() @RequirePermissions('organization.read') async list() {
    const o = await this.org();
    return this.prisma.academicCalendarDay.findMany({
      where: { organizationId: o.id },
      orderBy: { calendarDate: 'asc' },
    });
  }
  @Put() @RequirePermissions('organization.manage') async save(
    @Body() d: CalendarDayDto,
  ) {
    const o = await this.org(),
      calendarDate = new Date(`${d.date}T00:00:00.000Z`);
    return this.prisma.academicCalendarDay.upsert({
      where: {
        organizationId_calendarDate: { organizationId: o.id, calendarDate },
      },
      update: { dayType: d.dayType, label: d.label },
      create: {
        organizationId: o.id,
        calendarDate,
        dayType: d.dayType,
        label: d.label,
      },
    });
  }
}
