import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Admin username, or staff/learner contact number without country code',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({
    required: false,
    enum: AccountType,
    description: 'Required when the same contact number belongs to both a staff and learner portal account.',
  })
  @IsOptional()
  @IsEnum(AccountType)
  accountType?: AccountType;

  @ApiProperty({ example: 'Welcome123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
