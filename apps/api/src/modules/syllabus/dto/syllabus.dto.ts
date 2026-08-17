import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const SYLLABUS_CONTENT_MAX_LENGTH = 2_000_000;

export class SyllabusSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  subjectName!: string;

  @ApiProperty({ example: '## Algebra\n\n- Linear equations' })
  @IsString()
  @MaxLength(SYLLABUS_CONTENT_MAX_LENGTH)
  content!: string;
}

export class SyllabusGroupDto {
  @ApiProperty({ example: 'First Term' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ type: [SyllabusSubjectDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyllabusSubjectDto)
  subjects!: SyllabusSubjectDto[];
}

export class SyllabusClassDto {
  @ApiProperty({ example: '9th' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  className!: string;

  @ApiProperty({ type: [SyllabusGroupDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyllabusGroupDto)
  groups!: SyllabusGroupDto[];
}

export class CreateSessionSyllabusDto {
  @ApiProperty({ example: '2026-27' })
  @IsString()
  @Matches(/^\d{4}-(?:\d{2}|\d{4})$/, {
    message: 'sessionYear must use YYYY-YY or YYYY-YYYY format',
  })
  sessionYear!: string;

  @ApiProperty({ type: [SyllabusClassDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyllabusClassDto)
  classes!: SyllabusClassDto[];
}

export class UpdateSessionSyllabusDto {
  @ApiProperty({
    description: 'updatedAt value from the syllabus being edited',
  })
  @IsDateString()
  expectedUpdatedAt!: string;

  @ApiProperty({ type: [SyllabusClassDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SyllabusClassDto)
  classes!: SyllabusClassDto[];
}
