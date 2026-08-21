import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  TimetableMode,
  TimetableProfileScope,
  TimetableSlotType,
  Weekday,
} from '@prisma/client';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class TimetableSlotDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsEnum(Weekday) weekday?: Weekday;
  @IsEnum(TimetableSlotType) slotType!: TimetableSlotType;
  @IsOptional() @IsInt() @Min(1) periodNumber?: number | null;
  @IsString() @Matches(timePattern) startsAt!: string;
  @IsString() @Matches(timePattern) endsAt!: string;
}

export class CreateTimetableProfileDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEnum(TimetableProfileScope) scope!: TimetableProfileScope;
  @IsOptional() @IsString() academicOfferingId?: string;
  @IsEnum(TimetableMode) timetableMode!: TimetableMode;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TimetableSlotDto)
  slots!: TimetableSlotDto[];
}

export class UpdateTimetableProfileDto {
  @IsOptional() @IsString() @IsNotEmpty() name?: string;
  @IsOptional() @IsEnum(TimetableMode) timetableMode?: TimetableMode;
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TimetableSlotDto)
  slots?: TimetableSlotDto[];
}

export class BulkTimetableAssignmentItemDto {
  @IsString() timetableSlotId!: string;
  @IsString() subjectId!: string;
  @IsString() staffProfileId!: string;
}

export class BulkSaveTimetableAssignmentsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BulkTimetableAssignmentItemDto)
  assignments!: BulkTimetableAssignmentItemDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  clearedTimetableSlotIds?: string[];

  @IsOptional() @IsBoolean() replaceTeacherConflicts?: boolean;
}

export class TimetablePreviewDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TimetableSlotDto)
  slots!: TimetableSlotDto[];
  @IsEnum(TimetableMode) timetableMode!: TimetableMode;
}

export class TimetableProfileStateDto {
  @IsBoolean() isActive!: boolean;
}

export class CreateTimetableDailyOverrideDto {
  @IsString() timetableAssignmentId!: string;
  @IsString() overrideStaffProfileId!: string;
  @IsDateString() overrideDate!: string;
}
