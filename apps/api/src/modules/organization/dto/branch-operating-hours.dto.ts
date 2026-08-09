import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateBranchOperatingHourDto {
  @ApiProperty({ example: 'Morning Program' })
  @IsString()
  @MaxLength(120)
  label!: string;

  @ApiProperty({ example: '07:00', description: '24-hour Pakistan local time' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  opensAt!: string;

  @ApiProperty({ example: '14:00', description: '24-hour Pakistan local time' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  closesAt!: string;
}

export class UpdateBranchOperatingHourDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  opensAt?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  closesAt?: string;
}
