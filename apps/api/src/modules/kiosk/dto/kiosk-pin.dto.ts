import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class KioskPinDto {
  @ApiProperty()
  @IsString()
  staffId!: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @Matches(/^\d{4}$/)
  pin!: string;
}
