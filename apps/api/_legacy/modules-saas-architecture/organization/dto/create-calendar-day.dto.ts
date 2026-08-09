import { CalendarDayType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCalendarDayDto {
  @IsDateString()
  date!: string;

  @IsEnum(CalendarDayType)
  type!: CalendarDayType;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  label!: string;
}
