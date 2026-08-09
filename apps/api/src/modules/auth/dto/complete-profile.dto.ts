import { IsString, MinLength } from 'class-validator';
export class CompleteProfileDto { @IsString() @MinLength(8) newPassword!: string; }
