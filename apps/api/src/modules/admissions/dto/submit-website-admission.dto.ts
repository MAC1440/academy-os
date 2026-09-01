import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class SubmitWebsiteAdmissionDto {
  @IsString() @IsNotEmpty() academicOfferingId!: string;
  @IsString() @IsNotEmpty() @MaxLength(160) studentFullName!: string;
  @IsString()
  @Matches(/^\d{13}$/, {
    message: 'B-Form number must contain exactly 13 digits',
  })
  studentCnic!: string;
  @IsDateString() dateOfBirth!: string;
  @IsIn(['MALE', 'FEMALE', 'OTHER']) gender!: 'MALE' | 'FEMALE' | 'OTHER';
  @IsString() @IsNotEmpty() @MaxLength(160) guardianFullName!: string;
  @IsString() @IsNotEmpty() @MaxLength(80) relationship!: string;
  @IsString()
  @Matches(/^(?:\+92|0)3\d{9}$/, {
    message: 'Enter a valid Pakistan mobile number',
  })
  guardianPhone!: string;
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+92|0)3\d{9}$/)
  alternatePhone?: string;
  @IsOptional() @IsEmail() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(300) previousSchool?: string;
  @IsOptional() @IsString() @MaxLength(120) previousClass?: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) address!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
  @IsOptional() @IsString() @MaxLength(0) website?: string;
}
