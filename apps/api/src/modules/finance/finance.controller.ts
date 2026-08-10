import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FinanceService } from './finance.service';
class CreatePaymentDto {
  @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @IsString() receiptNumber!: string;
  @IsDateString() receivedOn!: string;
  @IsOptional() @IsString() remarks?: string;
}
@ApiTags('Finance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('students/:studentId/finance')
export class FinanceController {
  constructor(private readonly service: FinanceService) {}
  @Get() @RequirePermissions('finance.read') summary(
    @Param('studentId') studentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.summary(studentId, user.id);
  }
  @Post('payments') @RequirePermissions('finance.manage') create(
    @Param('studentId') studentId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.createPayment(studentId, dto, user.id);
  }
}
