import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiProperty()
  @IsString()
  roleId!: string;

  @ApiPropertyOptional({ description: 'Omit for organization-wide access.' })
  @IsOptional()
  @IsString()
  branchId?: string;
}
