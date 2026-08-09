import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { RequirePermissions } from '../access/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../access/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessService } from '../access/access.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

class StudentReportQuery { @IsString() academicOfferingId!: string; @IsDateString() from!: string; @IsDateString() to!: string; }

@ApiTags('Reports') @ApiBearerAuth('JWT-auth') @UseGuards(JwtAuthGuard, PermissionsGuard) @Controller('reports')
export class ReportsController {
  constructor(private readonly prisma: PrismaService, private readonly access: AccessService) {}
  @Get('student-attendance') @RequirePermissions('reports.read')
  async studentAttendance(@Query() q: StudentReportQuery, @CurrentUser() user: AuthenticatedUser) {
    const offering = await this.prisma.academicOffering.findUnique({ where: { id: q.academicOfferingId } });
    if (!offering || !(await this.access.canAccessBranch(user.id, offering.branchId))) throw new Error('Branch access denied');
    const from = new Date(`${q.from}T00:00:00.000Z`), to = new Date(`${q.to}T00:00:00.000Z`);
    const students = await this.prisma.student.findMany({ where: { academicOfferingId: q.academicOfferingId, deletedAt: null }, include: { attendance: { where: { attendanceDate: { gte: from, lte: to } } } }, orderBy: { studentFullName: 'asc' } });
    return { from: q.from, to: q.to, students: students.map(s => ({ id: s.id, name: s.studentFullName, present: s.attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length, marked: s.attendance.length, absentAtReportTime: true })) };
  }
  @Get('student-attendance.csv') @RequirePermissions('reports.read')
  async studentAttendanceCsv(@Query() q: StudentReportQuery, @CurrentUser() user: AuthenticatedUser) {
    const report = await this.studentAttendance(q, user);
    return ['student_id,name,present,marked,unmarked_treated_as_absent', ...report.students.map(s => `${s.id},"${s.name.replace(/"/g,'""')}",${s.present},${s.marked},true`)].join('\n');
  }
  @Get('staff-attendance') @RequirePermissions('reports.read')
  async staffAttendance(@Query('branchId') branchId: string, @Query('from') fromValue: string, @Query('to') toValue: string, @CurrentUser() user: AuthenticatedUser) {
    if (!(await this.access.canAccessBranch(user.id, branchId))) throw new Error('Branch access denied');
    const from = new Date(`${fromValue}T00:00:00.000Z`), to = new Date(`${toValue}T00:00:00.000Z`);
    const records = await this.prisma.staffAttendance.findMany({ where: { branchId, attendanceDate: { gte: from, lte: to } }, include: { staffProfile: { include: { user: { select: { fullName: true } } } } }, orderBy: { attendanceDate: 'asc' } });
    return records.map(r => ({ staffId: r.staffProfileId, name: r.staffProfile.user.fullName, date: r.attendanceDate, status: r.status, checkInAt: r.checkInAt, checkOutAt: r.checkOutAt, missingCheckout: !r.checkOutAt }));
  }
  @Get('staff-attendance.csv') @RequirePermissions('reports.read')
  async staffAttendanceCsv(@Query('branchId') branchId: string, @Query('from') fromValue: string, @Query('to') toValue: string, @CurrentUser() user: AuthenticatedUser) {
    const records = await this.staffAttendance(branchId, fromValue, toValue, user);
    return ['staff_id,name,date,status,check_in,check_out,missing_checkout', ...records.map(r => `${r.staffId},"${r.name.replace(/"/g,'""')}",${r.date.toISOString().slice(0,10)},${r.status},${r.checkInAt.toISOString()},${r.checkOutAt?.toISOString() ?? ''},${r.missingCheckout}`)].join('\n');
  }
}
