import { IsBoolean } from 'class-validator';

export class UpdateAcademicSettingsDto {
  @IsBoolean()
  sectionsEnabled!: boolean;
}
