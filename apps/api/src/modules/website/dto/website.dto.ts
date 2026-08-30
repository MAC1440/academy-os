import { WebsiteTemplate } from '@prisma/client';
import {
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class WebsiteSettingsDto {
  @IsString()
  @MaxLength(160)
  schoolName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  tagline?: string;

  @IsEnum(WebsiteTemplate)
  template!: WebsiteTemplate;

  @IsHexColor()
  primaryColor!: string;

  @IsHexColor()
  secondaryColor!: string;

  @IsHexColor()
  accentColor!: string;
}
