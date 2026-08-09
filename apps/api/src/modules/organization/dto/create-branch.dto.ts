import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Gulberg Campus' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ example: '12 Main Boulevard, Gulberg III, Lahore' })
  @IsString()
  @MaxLength(300)
  address!: string;

  @ApiPropertyOptional({ example: 'Lahore' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}
