import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AdmissionListQueryDto {
  @ApiPropertyOptional({ enum: AdmissionStatus })
  @IsOptional()
  @IsEnum(AdmissionStatus)
  status?: AdmissionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchId?: string;
}
