import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SubmitAdmissionDto {
  @ApiProperty()
  @IsString()
  academicOfferingId!: string;

  @ApiProperty({ example: 'Muhammad Ali' })
  @IsString()
  @MaxLength(160)
  studentFullName!: string;

  @ApiProperty({ example: '3520212345671', description: 'Student CNIC/B-Form number: exactly 13 digits.' })
  @IsString()
  @Matches(/^\d{13}$/)
  studentCnic!: string;

  @ApiProperty({ example: 'Ahmed Ali' })
  @IsString()
  @MaxLength(160)
  guardianFullName!: string;

  @ApiProperty({ example: '3001234567', description: 'Without country code.' })
  @IsString()
  @Matches(/^\d{7,15}$/)
  guardianContactNumber!: string;

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
    description: 'Structured details from the approved physical-form contract: father name, date of birth, nationality, addresses, phones, academic history, guardian employment, and siblings.',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  formData?: Record<string, unknown>;
}
