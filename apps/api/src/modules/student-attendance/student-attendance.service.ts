import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SaveStudentAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class StudentAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async roster(offeringId: string, attendanceDate: string) {
    const students = await this.prisma.student.findMany({
      where: { academicOfferingId: offeringId, deletedAt: null },
      include: { attendance: { where: { attendanceDate: this.date(attendanceDate) } } },
      orderBy: { studentFullName: 'asc' },
    });
    return students.map((student) => ({ id: student.id, fullName: student.studentFullName, registrationNumber: student.registrationNumber, status: student.attendance[0]?.status ?? null }));
  }

  async save(offeringId: string, dto: SaveStudentAttendanceDto, actorUserId: string) {
    const students = await this.prisma.student.findMany({ where: { id: { in: dto.records.map((record) => record.studentId) }, academicOfferingId: offeringId, deletedAt: null }, select: { id: true } });
    if (students.length !== dto.records.length) throw new NotFoundException('One or more students are not enrolled in this academic offering');
    const attendanceDate = this.date(dto.attendanceDate);
    await this.prisma.$transaction(dto.records.map((record) => this.prisma.studentAttendance.upsert({ where: { studentId_attendanceDate: { studentId: record.studentId, attendanceDate } }, update: { status: record.status, markedByUserId: actorUserId }, create: { studentId: record.studentId, attendanceDate, status: record.status, markedByUserId: actorUserId } })));
    return this.roster(offeringId, dto.attendanceDate);
  }

  private date(value: string) { return new Date(`${value}T00:00:00.000Z`); }
}
