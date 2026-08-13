import { AssessmentType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  IsOptional,
} from 'class-validator';
export class CreateAssessmentDto {
  @IsString() title!: string;
  @IsEnum(AssessmentType) assessmentType!: AssessmentType;
  @IsDateString() heldOn!: string;
}
export class UpdateAssessmentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(AssessmentType) assessmentType?: AssessmentType;
  @IsOptional() @IsDateString() heldOn?: string;
}
export class MarkDto {
  @IsString() studentId!: string;
  @IsString() subjectId!: string;
  @IsNumber() @Min(0.01) maximumMarks!: number;
  @IsNumber() @Min(0) obtainedMarks!: number;
}
export class SaveMarksDto {
  @IsArray() marks!: MarkDto[];
}
