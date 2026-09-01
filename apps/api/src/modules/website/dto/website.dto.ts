import { WebsiteTemplate } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsEmail,
  IsHexColor,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
  Min,
  ValidateNested,
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

class ToggleDto {
  @IsBoolean()
  enabled!: boolean;
}

class HeroDto extends ToggleDto {
  @IsString() @MaxLength(160) title!: string;
  @IsOptional() @IsString() @MaxLength(300) subtitle?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;
  @IsOptional() @IsString() @MaxLength(80) ctaText?: string;
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Matches(/^(#|\/(?!\/)|https?:\/\/)/, {
    message: 'CTA link must be an anchor, internal path, or HTTP(S) URL',
  })
  ctaLink?: string;
}

class IntroductionDto extends ToggleDto {
  @IsString() @MaxLength(160) heading!: string;
  @IsString() @MaxLength(4000) content!: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;
}

class PrincipalMessageDto extends ToggleDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(160) designation?: string;
  @IsOptional() @IsString() @MaxLength(5000) message?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;
}

class HomepageDto {
  @ValidateNested() @Type(() => HeroDto) hero!: HeroDto;
  @ValidateNested() @Type(() => IntroductionDto) introduction!: IntroductionDto;
  @ValidateNested()
  @Type(() => PrincipalMessageDto)
  principalMessage!: PrincipalMessageDto;
  @ValidateNested() @Type(() => ToggleDto) programs!: ToggleDto;
  @ValidateNested() @Type(() => ToggleDto) facilities!: ToggleDto;
  @ValidateNested() @Type(() => ToggleDto) faculty!: ToggleDto;
  @ValidateNested() @Type(() => ToggleDto) contact!: ToggleDto;
}

class WebsiteProgramDto {
  @IsOptional() @IsString() @MaxLength(80) sourceId?: string;
  @IsString() @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(1200) description?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;
  @IsBoolean() visible!: boolean;
  @IsInt() @Min(0) sortOrder!: number;
}

class WebsiteFacilityDto {
  @IsString() @MaxLength(160) title!: string;
  @IsOptional() @IsString() @MaxLength(1200) description?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;
  @IsBoolean() visible!: boolean;
  @IsInt() @Min(0) sortOrder!: number;
}

class WebsiteFacultyDto {
  @IsOptional() @IsString() @MaxLength(80) sourceTeacherId?: string;
  @IsString() @MaxLength(160) name!: string;
  @IsString() @MaxLength(160) designation!: string;
  @IsOptional() @IsString() @MaxLength(240) qualification?: string;
  @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) subjects!: string[];
  @IsOptional() @IsString() @MaxLength(1200) bio?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  imageUrl?: string;
  @IsBoolean() visible!: boolean;
  @IsInt() @Min(0) sortOrder!: number;
}

class WebsiteAdmissionsDto {
  @IsBoolean() enabled!: boolean;
  @IsBoolean() isOpen!: boolean;
  @IsString() @MaxLength(160) heading!: string;
  @IsString() @MaxLength(2000) description!: string;
  @IsArray()
  @ArrayMaxSize(80)
  @IsString({ each: true })
  eligibleOfferingIds!: string[];
  @IsString() @MaxLength(500) confirmationMessage!: string;
}

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

  @ValidateNested()
  @Type(() => HomepageDto)
  homepage!: HomepageDto;

  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => WebsiteProgramDto)
  programs!: WebsiteProgramDto[];

  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => WebsiteFacilityDto)
  facilities!: WebsiteFacilityDto[];

  @IsArray()
  @ArrayMaxSize(80)
  @ValidateNested({ each: true })
  @Type(() => WebsiteFacultyDto)
  faculty!: WebsiteFacultyDto[];

  @ValidateNested()
  @Type(() => WebsiteAdmissionsDto)
  admissions!: WebsiteAdmissionsDto;
}
