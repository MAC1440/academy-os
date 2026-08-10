import { ApiProperty } from '@nestjs/swagger';
import { StudentAttendanceStatus } from '@prisma/client';
import { IsArray, IsDateString, IsEnum, IsString } from 'class-validator';

export class MarkStudentAttendanceDto {
  @IsString() studentId!: string;
  @IsEnum(StudentAttendanceStatus) status!: StudentAttendanceStatus;
}
export class SaveStudentAttendanceDto {
  @ApiProperty() @IsDateString() attendanceDate!: string;
  @ApiProperty({ type: [MarkStudentAttendanceDto] })
  @IsArray()
  records!: MarkStudentAttendanceDto[];
}
