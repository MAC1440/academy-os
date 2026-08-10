import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { SaveStudentAttendanceDto } from './dto/mark-attendance.dto';

@Injectable()
export class StudentAttendanceService {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}

  async roster(offeringId: string, attendanceDate: string, actorUserId: string) {
    await this.ensureBranchAccess(offeringId, actorUserId);
    const students = await this.prisma.student.findMany({
      where: { academicOfferingId: offeringId, deletedAt: null },
      include: { attendance: { where: { attendanceDate: this.date(attendanceDate) } } },
      orderBy: { studentFullName: 'asc' },
    });
    return students.map((student) => ({ id: student.id, fullName: student.studentFullName, registrationNumber: student.registrationNumber, status: student.attendance[0]?.status ?? null }));
  }

  async save(offeringId: string, dto: SaveStudentAttendanceDto, actorUserId: string) {
    await this.ensureBranchAccess(offeringId, actorUserId);
    const students = await this.prisma.student.findMany({ where: { id: { in: dto.records.map((record) => record.studentId) }, academicOfferingId: offeringId, deletedAt: null }, select: { id: true } });
    if (students.length !== dto.records.length) throw new NotFoundException('One or more students are not enrolled in this academic offering');
    const attendanceDate = this.date(dto.attendanceDate);
    await this.prisma.$transaction(dto.records.map((record) => this.prisma.studentAttendance.upsert({ where: { studentId_attendanceDate: { studentId: record.studentId, attendanceDate } }, update: { status: record.status, markedByUserId: actorUserId }, create: { studentId: record.studentId, attendanceDate, status: record.status, markedByUserId: actorUserId } })));
    return this.roster(offeringId, dto.attendanceDate, actorUserId);
  }

  private date(value: string) { return new Date(`${value}T00:00:00.000Z`); }
  private async ensureBranchAccess(offeringId: string, userId: string) { const offering = await this.prisma.academicOffering.findUnique({ where: { id: offeringId } }); if (!offering) throw new NotFoundException('Academic offering not found'); if (!(await this.access.canAccessBranch(userId, offering.branchId))) throw new ForbiddenException('You do not have access to this branch'); }
}
