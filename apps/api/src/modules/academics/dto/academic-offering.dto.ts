import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicOfferingType, EntityStatus } from '@prisma/client';
import { ArrayUnique, IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAcademicOfferingDto {
  @ApiProperty({ enum: AcademicOfferingType })
  @IsEnum(AcademicOfferingType)
  offeringType!: AcademicOfferingType;

  @ApiPropertyOptional({ description: 'Required when offeringType is SCHOOL_CLASS.' })
  @IsOptional()
  @IsString()
  schoolClassId?: string;

  @ApiPropertyOptional({ description: 'Required when offeringType is COURSE.' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ example: 'A', description: 'Required when the chosen school class has sections enabled.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sectionName?: string;
}

export class UpdateAcademicOfferingDto {
  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sectionName?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class ReplaceAcademicOfferingSubjectsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  subjectIds!: string[];
}

export class ReplaceAcademicOfferingTeachersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  staffProfileIds!: string[];
}
