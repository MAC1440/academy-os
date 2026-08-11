import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkStudentImportRowDto {
  @IsString() @MaxLength(160) campusName!: string;
  @IsString() @MaxLength(160) classOrCourse!: string;
  @IsOptional() @IsString() @MaxLength(80) sectionName?: string;
  @IsString() @MaxLength(160) academicTermName!: string;
  @IsString() @MaxLength(160) studentFullName!: string;
  @IsString() @Matches(/^\d{13}$/) studentCnic!: string;
  @IsString() @MaxLength(160) guardianFullName!: string;
  @IsString() @Matches(/^\d{7,15}$/) guardianContactNumber!: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyFeeAmount?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountReceivedWithForm?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalanceAmount?: number;
  @IsOptional() @IsString() @MaxLength(100) receiptNumber?: string;
  @IsOptional() @IsDateString() balanceDueOn?: string;
  @IsOptional() @IsString() @MaxLength(300) previousSchool?: string;
  @IsOptional() @IsString() @MaxLength(2000) previousPerformance?: string;
  @IsOptional() @IsString() @MaxLength(500) admissionNote?: string;
  @IsOptional() @IsBoolean() physicalDocumentsVerified?: boolean;
}

export class BulkStudentImportDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => BulkStudentImportRowDto)
  rows!: BulkStudentImportRowDto[];
}

/** A permissive payload used to return row-level CSV guidance before final import validation. */
export class BulkStudentImportPreviewDto {
  @IsArray()
  @ArrayMaxSize(200)
  rows!: Record<string, unknown>[];
}
