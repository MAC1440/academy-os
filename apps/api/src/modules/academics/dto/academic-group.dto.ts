import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAcademicGroupDto {
  @ApiProperty({ example: 'Pre-Medical' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'PRE_MED' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @ApiProperty({
    type: [String],
    description: 'School classes that can use this group.',
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  schoolClassIds!: string[];
}

export class UpdateAcademicGroupDto {
  @ApiPropertyOptional({ example: 'Pre-Medical' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'PRE_MED' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}

export class ReplaceAcademicGroupSchoolClassesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  schoolClassIds!: string[];
}
