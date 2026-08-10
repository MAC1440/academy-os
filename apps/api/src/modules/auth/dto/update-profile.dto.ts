import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'ahmed-admin' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  username?: string;

  @ApiPropertyOptional({
    example: '03135418790',
    description: 'Without country code',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{7,15}$/)
  contactNumber?: string;

  @ApiPropertyOptional({ example: 'Ahmed Khan' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  fullName?: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Leave empty to keep the current password.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
