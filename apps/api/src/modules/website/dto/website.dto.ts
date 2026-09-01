import { WebsiteTemplate } from '@prisma/client';
import {
  IsEnum,
  IsEmail,
  IsHexColor,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export const WEBSITE_FONTS = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Merriweather',
] as const;

export class WebsiteSettingsDto {
  @IsString()
  @MaxLength(160)
  schoolName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  tagline?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  logoUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  faviconUrl?: string;

  @IsEnum(WebsiteTemplate)
  template!: WebsiteTemplate;

  @IsHexColor()
  primaryColor!: string;

  @IsHexColor()
  secondaryColor!: string;

  @IsHexColor()
  accentColor!: string;

  @IsIn(WEBSITE_FONTS)
  headingFont!: (typeof WEBSITE_FONTS)[number];

  @IsIn(WEBSITE_FONTS)
  bodyFont!: (typeof WEBSITE_FONTS)[number];

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  facebookUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  instagramUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  youtubeUrl?: string;
}
