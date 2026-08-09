import { StaffType } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateStaffProfileDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(StaffType)
  type?: StaffType;

  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsString()
  @Length(4, 4)
  @Matches(/^\d{4}$/)
  pin!: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  branchIds!: string[];
}
