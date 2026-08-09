import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffType } from '@prisma/client';
import { ArrayMinSize, ArrayUnique, IsArray, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ example: 'Ayesha Khan' })
  @IsString()
  @MaxLength(160)
  fullName!: string;

  @ApiProperty({ example: '3001234567', description: 'Without country code' })
  @IsString()
  @Matches(/^\d{7,15}$/)
  contactNumber!: string;

  @ApiPropertyOptional({ example: 'ayesha@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: StaffType, default: StaffType.TEACHER })
  @IsOptional()
  @IsEnum(StaffType)
  staffType?: StaffType;

  @ApiPropertyOptional({ example: 'Mathematics Teacher' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  designation?: string;

  @ApiProperty({ type: [String], description: 'Branches where this staff member is assigned' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  branchIds!: string[];

  @ApiPropertyOptional({ description: 'Role id. Defaults to Teacher or Staff based on staff type.' })
  @IsOptional()
  @IsString()
  roleId?: string;
}
