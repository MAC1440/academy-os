import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateStudentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  studentFullName?: string;

  @ApiPropertyOptional({
    description: 'Student CNIC/B-Form number: exactly 13 digits.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/)
  studentCnic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  previousSchool?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  previousPerformance?: string;

  @ApiPropertyOptional({
    description: 'Move the student to another offering in the same branch.',
  })
  @IsOptional()
  @IsString()
  academicOfferingId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academicTermId?: string;
}
