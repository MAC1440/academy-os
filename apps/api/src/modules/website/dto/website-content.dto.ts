import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { WebsiteMediaCategory } from '@prisma/client';

export class AnnouncementDto {
  @IsString() @MaxLength(180) title!: string;
  @IsString() @MaxLength(2000) description!: string;
  @IsBoolean() published!: boolean;
  @IsBoolean() pinned!: boolean;
  @IsOptional() @IsDateString() publishAt?: string;
  @IsOptional() @IsDateString() expireAt?: string;
}

export class NewsDto {
  @IsString() @MaxLength(180) title!: string;
  @IsString() @MaxLength(180) slug!: string;
  @IsOptional() @IsUrl({ require_protocol: true }) coverImageUrl?: string;
  @IsString() @MaxLength(500) excerpt!: string;
  @IsString() @MaxLength(30000) body!: string;
  @IsBoolean() published!: boolean;
  @IsOptional() @IsDateString() publishAt?: string;
  @IsOptional() @IsString() @MaxLength(180) seoTitle?: string;
  @IsOptional() @IsString() @MaxLength(320) seoDescription?: string;
}

export class ResultDto {
  @IsString() @MaxLength(180) title!: string;
  @IsString() @MaxLength(2000) description!: string;
  @IsString() @MaxLength(40) academicYear!: string;
  @IsArray() @IsString({ each: true }) highlights!: string[];
  @IsOptional() @IsUrl({ require_protocol: true }) imageUrl?: string;
  @IsBoolean() published!: boolean;
  @IsOptional() @IsDateString() publishAt?: string;
}

export class AlbumDto {
  @IsString() @MaxLength(180) title!: string;
  @IsString() @MaxLength(180) slug!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) coverImageUrl?: string;
  @IsOptional() @IsString() academicCalendarDayId?: string;
  @IsBoolean() published!: boolean;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) sortOrder!: number;
}

export class GalleryImageDto {
  @IsString() mediaId!: string;
  @IsOptional() @IsString() @MaxLength(240) caption?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) sortOrder!: number;
}

export class MediaUploadDto {
  @IsEnum(WebsiteMediaCategory) category!: WebsiteMediaCategory;
}
