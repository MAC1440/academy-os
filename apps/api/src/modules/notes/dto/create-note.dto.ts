import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'Algebra revision plan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Cover linear equations, then distribute the practice worksheet.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20_000)
  content!: string;
}
