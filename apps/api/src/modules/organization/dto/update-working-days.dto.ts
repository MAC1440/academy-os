import { ArrayUnique, IsArray, IsInt, Max, Min } from 'class-validator';

export class UpdateWorkingDaysDto {
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays!: number[];
}
