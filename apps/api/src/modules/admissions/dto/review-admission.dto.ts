import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ReviewAdmissionDto {
  @ApiProperty({ enum: [AdmissionStatus.APPROVED, AdmissionStatus.REJECTED] })
  @IsEnum(AdmissionStatus)
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;

  @ApiPropertyOptional({
    description:
      'Admin-selected campus/class/course allocation. Defaults to the submitted offering.',
  })
  @IsOptional()
  @IsString()
  academicOfferingId?: string;

  @ApiPropertyOptional({ description: 'Required for approval.' })
  @IsOptional()
  @IsString()
  academicTermId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyFeeAmount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountReceivedWithForm?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalanceAmount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  receiptNumber?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  balanceDueOn?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  physicalDocumentsVerified?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  physicalDocumentsVerificationNote?: string;
}
