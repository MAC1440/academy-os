import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AccountStatus, AuditAction, Prisma, StaffAttendanceStatus, Weekday } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { KioskPinDto } from './dto/kiosk-pin.dto';
import { OverrideStaffAttendanceDto } from './dto/override-staff-attendance.dto';
import { UpdateKioskSettingsDto } from './dto/update-kiosk-settings.dto';

const DEFAULT_WORKING_DAYS = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

@Injectable()
export class KioskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getSettings() {
    const organization = await this.organization();
    return this.prisma.attendanceKioskSettings.upsert({
      where: { organizationId: organization.id },
      update: {},
      create: { organizationId: organization.id, workingDays: DEFAULT_WORKING_DAYS },
    });
  }

  async updateSettings(dto: UpdateKioskSettingsDto, actorUserId: string) {
    const organization = await this.organization();
    const settings = await this.prisma.attendanceKioskSettings.upsert({
      where: { organizationId: organization.id },
      update: dto,
      create: { organizationId: organization.id, ...dto, workingDays: dto.workingDays ?? DEFAULT_WORKING_DAYS },
    });
    await this.audit(actorUserId, AuditAction.UPDATE, 'AttendanceKioskSettings', settings.id, dto);
    return settings;
  }

  async listBranchStaff(branchId: string) {
    await this.branch(branchId);
    return this.prisma.staffProfile.findMany({
      where: {
        user: {
          status: AccountStatus.ACTIVE,
          deletedAt: null,
          roleAssignments: { some: { branchId } },
        },
      },
      select: { id: true, staffType: true, designation: true, user: { select: { fullName: true } } },
      orderBy: { user: { fullName: 'asc' } },
    });
  }

  async checkIn(branchId: string, dto: KioskPinDto) {
    const { branch, staff, now, local } = await this.authenticateKioskAction(branchId, dto);
    const settings = await this.getSettings();
    const status = this.statusForCheckIn(local.hour, local.minute, settings.defaultStaffShiftStart, settings.graceMinutes);
    try {
      const attendance = await this.prisma.staffAttendance.create({
        data: {
          staffProfileId: staff.id,
          branchId: branch.id,
          attendanceDate: this.dateOnly(local.date),
          checkInAt: now,
          status,
        },
      });
      await this.audit(staff.userId, AuditAction.CREATE, 'StaffAttendance', attendance.id, { branchId, action: 'CHECK_IN' });
      return attendance;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This staff member has already checked in today');
      }
      throw error;
    }
  }

  async checkOut(branchId: string, dto: KioskPinDto) {
    const { staff, now, local } = await this.authenticateKioskAction(branchId, dto);
    const attendance = await this.prisma.staffAttendance.findUnique({
      where: { staffProfileId_attendanceDate: { staffProfileId: staff.id, attendanceDate: this.dateOnly(local.date) } },
    });
    if (!attendance || attendance.branchId !== branchId) throw new NotFoundException('No check-in was found for today');
    if (attendance.checkOutAt) throw new ConflictException('This staff member has already checked out today');

    const updated = await this.prisma.staffAttendance.update({ where: { id: attendance.id }, data: { checkOutAt: now } });
    await this.audit(staff.userId, AuditAction.UPDATE, 'StaffAttendance', attendance.id, { branchId, action: 'CHECK_OUT' });
    return updated;
  }

  async overrideAttendance(branchId: string, attendanceId: string, dto: OverrideStaffAttendanceDto, actorUserId: string) {
    const attendance = await this.prisma.staffAttendance.findFirst({ where: { id: attendanceId, branchId } });
    if (!attendance) throw new NotFoundException('Staff attendance record not found');
    const updated = await this.prisma.staffAttendance.update({
      where: { id: attendance.id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.overrideReason !== undefined ? { overrideReason: dto.overrideReason.trim() || null } : {}),
        ...(dto.checkOutAt ? { checkOutAt: new Date(dto.checkOutAt) } : {}),
      },
    });
    await this.audit(actorUserId, AuditAction.UPDATE, 'StaffAttendance', attendance.id, dto);
    return updated;
  }

  private async authenticateKioskAction(branchId: string, dto: KioskPinDto) {
    const branch = await this.branch(branchId);
    const staff = await this.prisma.staffProfile.findFirst({
      where: {
        id: dto.staffId,
        user: {
          status: AccountStatus.ACTIVE,
          deletedAt: null,
          roleAssignments: { some: { branchId } },
        },
      },
      include: { user: { select: { id: true, pinHash: true } } },
    });
    if (!staff?.user.pinHash || !(await bcrypt.compare(dto.pin, staff.user.pinHash))) {
      throw new UnauthorizedException('Invalid staff PIN');
    }
    const now = new Date();
    return { branch, staff: { id: staff.id, userId: staff.user.id }, now, local: this.karachiNow(now) };
  }

  private async organization() {
    const organization = await this.prisma.organization.findFirst();
    if (!organization) throw new NotFoundException('Organization has not been configured');
    return organization;
  }

  private async branch(branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, deletedAt: null } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  private statusForCheckIn(hour: number, minute: number, start: string, graceMinutes: number) {
    const [startHour = 0, startMinute = 0] = start.split(':').map(Number);
    const cutoff = startHour * 60 + startMinute + graceMinutes;
    return hour * 60 + minute > cutoff ? StaffAttendanceStatus.LATE : StaffAttendanceStatus.PRESENT;
  }

  private karachiNow(now: Date) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'long',
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
    const text = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
    return {
      date: `${text('year')}-${text('month')}-${text('day')}`,
      hour: value('hour'),
      minute: value('minute'),
      weekday: text('weekday').toUpperCase() as Weekday,
    };
  }

  private dateOnly(date: string) {
    return new Date(`${date}T00:00:00.000Z`);
  }

  private async audit(actorUserId: string, action: AuditAction, entityType: string, entityId: string, changes?: object) {
    const organization = await this.organization();
    await this.auditService.record({
      organizationId: organization.id,
      actorUserId,
      action,
      entityType,
      entityId,
      changes: changes as unknown as Prisma.InputJsonValue | undefined,
    });
  }
}
