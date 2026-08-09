import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Admin username, or staff/learner contact number without country code',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'Welcome123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
