import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class ReviewAdmissionDto {
  @ApiProperty({ enum: [AdmissionStatus.APPROVED, AdmissionStatus.REJECTED] })
  @IsIn([AdmissionStatus.APPROVED, AdmissionStatus.REJECTED])
  status!: 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional()
  @ValidateIf(
    (value: ReviewAdmissionDto) =>
      value.status === AdmissionStatus.REJECTED ||
      value.reviewNote !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'reviewNote must not be blank' })
  @MaxLength(500)
  reviewNote?: string;

  @ApiPropertyOptional({
    description:
      'Admin-selected campus/class/course allocation. Defaults to the submitted offering.',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'academicOfferingId must not be blank' })
  academicOfferingId?: string;

  @ApiPropertyOptional({ description: 'Required for approval.' })
  @ValidateIf(
    (value: ReviewAdmissionDto) =>
      value.status === AdmissionStatus.APPROVED ||
      value.academicTermId !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'academicTermId must not be blank' })
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
