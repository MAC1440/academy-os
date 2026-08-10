import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AcademicTermType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
class CreateTerm {
  @IsString() name!: string;
  @IsEnum(AcademicTermType) termType!: AcademicTermType;
  @IsDateString() startsOn!: string;
  @IsDateString() endsOn!: string;
}
class UpdateTerm {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(AcademicTermType) termType?: AcademicTermType;
  @IsOptional() @IsDateString() startsOn?: string;
  @IsOptional() @IsDateString() endsOn?: string;
}
class UpdateRegistration {
  @IsOptional() @IsString() prefix?: string;
  @IsOptional() @IsInt() @Min(3) @Max(8) sequencePadding?: number;
  @IsOptional() @IsInt() @Min(1) nextSequence?: number;
}
@ApiTags('Settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}
  private async org() {
    const o = await this.prisma.organization.findFirst();
    if (!o) throw new Error('Organization missing');
    return o;
  }
  @Get('academic-terms')
  @RequirePermissions('organization.read')
  async terms() {
    const o = await this.org();
    return this.prisma.academicTerm.findMany({
      where: { organizationId: o.id },
      orderBy: { startsOn: 'desc' },
    });
  }
  @Post('academic-terms')
  @RequirePermissions('organization.manage')
  async create(@Body() d: CreateTerm) {
    const o = await this.org();
    return this.prisma.academicTerm.create({
      data: {
        organizationId: o.id,
        name: d.name,
        termType: d.termType,
        startsOn: new Date(d.startsOn),
        endsOn: new Date(d.endsOn),
      },
    });
  }
  @Patch('academic-terms/:termId')
  @RequirePermissions('organization.manage')
  async updateTerm(@Param('termId') termId: string, @Body() d: UpdateTerm) {
    const o = await this.org();
    await this.prisma.academicTerm.findFirstOrThrow({
      where: { id: termId, organizationId: o.id },
    });
    return this.prisma.academicTerm.update({
      where: { id: termId },
      data: {
        ...d,
        ...(d.startsOn ? { startsOn: new Date(d.startsOn) } : {}),
        ...(d.endsOn ? { endsOn: new Date(d.endsOn) } : {}),
      },
    });
  }
  @Get('admission-registration')
  @RequirePermissions('organization.read')
  async registration() {
    const o = await this.org();
    return this.prisma.admissionRegistrationSettings.upsert({
      where: { organizationId: o.id },
      update: {},
      create: { organizationId: o.id },
    });
  }
  @Patch('admission-registration')
  @RequirePermissions('organization.manage')
  async update(@Body() d: UpdateRegistration) {
    const o = await this.org();
    return this.prisma.admissionRegistrationSettings.upsert({
      where: { organizationId: o.id },
      update: d,
      create: { organizationId: o.id, ...d },
    });
  }
}
