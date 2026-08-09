import { IsString, Length, Matches } from 'class-validator';

export class ResetStaffPinDto {
  @IsString() @Length(4, 4) @Matches(/^\d{4}$/) pin!: string;
}
