import { EntityStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAcademicYearDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name!: string;

  @IsDateString()
  startsOn!: string;

  @IsDateString()
  endsOn!: string;

  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
