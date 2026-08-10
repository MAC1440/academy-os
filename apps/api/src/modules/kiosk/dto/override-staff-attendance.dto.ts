import { ApiPropertyOptional } from '@nestjs/swagger';
import { StaffAttendanceStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class OverrideStaffAttendanceDto {
  @ApiPropertyOptional({ enum: StaffAttendanceStatus })
  @IsOptional()
  @IsEnum(StaffAttendanceStatus)
  status?: StaffAttendanceStatus;

  @ApiPropertyOptional({
    example: 'Approved late arrival due to official duty.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  overrideReason?: string;

  @ApiPropertyOptional({
    description: 'Optional checkout timestamp in ISO 8601 format.',
  })
  @IsOptional()
  @IsDateString()
  checkOutAt?: string;
}
