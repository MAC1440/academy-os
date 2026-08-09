import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewAdmissionDto {
  @ApiProperty({ enum: [AdmissionStatus.APPROVED, AdmissionStatus.REJECTED] })
  @IsEnum(AdmissionStatus)
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
