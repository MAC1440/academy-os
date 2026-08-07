import { EntityStatus } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateStaffProfileDto {
  @IsOptional() @IsEnum(EntityStatus) status?: EntityStatus;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  branchIds?: string[];
}
