import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditAction,
  EntityStatus,
  TimetableMode,
  TimetableProfileScope,
  TimetableSlotType,
  Weekday,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  BulkSaveTimetableAssignmentsDto,
  CreateTimetableProfileDto,
  TimetablePreviewDto,
  TimetableSlotDto,
  UpdateTimetableProfileDto,
} from './dto/timetable.dto';

const SCHOOL_DAYS = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];
const minutes = (time: string) =>
  Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

@Injectable()
export class TimetableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async preview(dto: TimetablePreviewDto) {
    return this.validateSlots(dto.slots, dto.timetableMode);
  }

  async listProfiles(branchId: string, actor: string) {
    await this.ensureBranchAccess(actor, branchId);
    return this.prisma.timetableProfile.findMany({
      where: { branchId, deletedAt: null },
      include: {
        academicOffering: { include: { schoolClass: true, course: true } },
        slots: true,
        _count: { select: { assignments: true } },
      },
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
    });
  }

  async getProfile(profileId: string, actor: string) {
    const profile = await this.profile(profileId);
    await this.ensureBranchAccess(actor, profile.branchId);
    return this.profileDetails(profileId);
  }

  async createProfile(
    branchId: string,
    dto: CreateTimetableProfileDto,
    actor: string,
  ) {
    await this.ensureBranchAccess(actor, branchId);
    await this.validateProfileTarget(
      branchId,
      dto.scope,
      dto.academicOfferingId,
    );
    this.validateSlots(dto.slots, dto.timetableMode);
    const profile = await this.prisma.timetableProfile.create({
      data: {
        branchId,
        name: dto.name.trim(),
        scope: dto.scope,
        academicOfferingId:
          dto.scope === TimetableProfileScope.CLASS_OVERRIDE
            ? dto.academicOfferingId
            : null,
        timetableMode: dto.timetableMode,
        slots: { create: dto.slots.map((slot) => this.slotData(slot)) },
      },
    });
    await this.recordAudit(actor, AuditAction.CREATE, profile.id, {
      branchId,
      name: dto.name,
      scope: dto.scope,
    });
    return this.profileDetails(profile.id);
  }

  async updateProfile(
    profileId: string,
    dto: UpdateTimetableProfileDto,
    actor: string,
  ) {
    const profile = await this.profile(profileId);
    await this.ensureBranchAccess(actor, profile.branchId);
    const mode = dto.timetableMode ?? profile.timetableMode;
    if (dto.slots) this.validateSlots(dto.slots, mode);
    await this.prisma.$transaction(async (tx) => {
      await tx.timetableProfile.update({
        where: { id: profile.id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.timetableMode ? { timetableMode: dto.timetableMode } : {}),
        },
      });
      if (dto.slots) {
        await tx.timetableSlot.deleteMany({
          where: { timetableProfileId: profile.id },
        });
        await tx.timetableSlot.createMany({
          data: dto.slots.map((slot) => ({
            timetableProfileId: profile.id,
            ...this.slotData(slot),
          })),
        });
      }
    });
    await this.recordAudit(actor, AuditAction.UPDATE, profile.id, dto);
    return this.profileDetails(profile.id);
  }

  async setProfileActive(profileId: string, isActive: boolean, actor: string) {
    const profile = await this.profile(profileId);
    await this.ensureBranchAccess(actor, profile.branchId);
    if (isActive) await this.validateProfileAssignments(profile.id);
    await this.prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.timetableProfile.updateMany({
          where:
            profile.scope === TimetableProfileScope.BRANCH
              ? {
                  branchId: profile.branchId,
                  scope: TimetableProfileScope.BRANCH,
                  deletedAt: null,
                }
              : {
                  academicOfferingId: profile.academicOfferingId!,
                  scope: TimetableProfileScope.CLASS_OVERRIDE,
                  deletedAt: null,
                },
          data: { isActive: false },
        });
      }
      await tx.timetableProfile.update({
        where: { id: profile.id },
        data: { isActive },
      });
    });
    await this.recordAudit(actor, AuditAction.UPDATE, profile.id, { isActive });
    return this.profileDetails(profile.id);
  }

  async archiveProfile(profileId: string, actor: string) {
    const profile = await this.profile(profileId);
    await this.ensureBranchAccess(actor, profile.branchId);
    await this.prisma.timetableProfile.update({
      where: { id: profile.id },
      data: {
        isActive: false,
        status: EntityStatus.ARCHIVED,
        deletedAt: new Date(),
      },
    });
    await this.recordAudit(actor, AuditAction.DELETE, profile.id, {});
    return { id: profile.id };
  }

  async effectiveProfile(offeringId: string, actor: string) {
    const offering = await this.offering(offeringId);
    await this.ensureBranchAccess(actor, offering.branchId);
    const override = await this.prisma.timetableProfile.findFirst({
      where: {
        academicOfferingId: offeringId,
        scope: TimetableProfileScope.CLASS_OVERRIDE,
        isActive: true,
        deletedAt: null,
      },
    });
    const profile =
      override ??
      (await this.prisma.timetableProfile.findFirst({
        where: {
          branchId: offering.branchId,
          scope: TimetableProfileScope.BRANCH,
          isActive: true,
          deletedAt: null,
        },
      }));
    if (!profile)
      throw new NotFoundException(
        'No active timetable profile is available for this class',
      );
    return this.profileDetails(profile.id);
  }

  async saveAssignments(
    offeringId: string,
    profileId: string,
    dto: BulkSaveTimetableAssignmentsDto,
    actor: string,
  ) {
    const offering = await this.offering(offeringId);
    await this.ensureBranchAccess(actor, offering.branchId);
    const effective = await this.effectiveProfile(offeringId, actor);
    if (effective.id !== profileId)
      throw new BadRequestException(
        "Assignments must use this class's active effective profile",
      );
    const ids = dto.assignments.map((item) => item.timetableSlotId);
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException(
        'A teaching period can have only one assignment',
      );
    const slots = await this.prisma.timetableSlot.findMany({
      where: { id: { in: ids }, timetableProfileId: profileId },
    });
    if (
      slots.length !== ids.length ||
      slots.some((slot) => slot.slotType !== TimetableSlotType.TEACHING)
    )
      throw new BadRequestException(
        'Every assignment must reference a teaching period in the selected profile',
      );
    await this.validateAssignmentReferences(offeringId, offering.branchId, dto);
    const conflicts = await this.findTeacherConflicts(
      offeringId,
      profileId,
      dto.assignments,
      slots,
    );
    if (conflicts.length && !dto.replaceTeacherConflicts) {
      throw new ConflictException({
        message: 'One or more teachers are already assigned during these times',
        conflicts,
      });
    }
    await this.prisma.$transaction(async (tx) => {
      if (conflicts.length)
        await tx.timetableAssignment.deleteMany({
          where: {
            id: { in: conflicts.map((conflict) => conflict.assignmentId) },
          },
        });
      await tx.timetableAssignment.deleteMany({
        where: {
          academicOfferingId: offeringId,
          timetableProfileId: profileId,
        },
      });
      if (dto.assignments.length)
        await tx.timetableAssignment.createMany({
          data: dto.assignments.map((item) => ({
            branchId: offering.branchId,
            academicOfferingId: offeringId,
            timetableProfileId: profileId,
            timetableSlotId: item.timetableSlotId,
            subjectId: item.subjectId,
            staffProfileId: item.staffProfileId,
          })),
        });
    });
    await this.recordAudit(actor, AuditAction.UPDATE, profileId, {
      offeringId,
      assignments: dto.assignments.length,
    });
    return this.classTimetable(offeringId, actor);
  }

  async classTimetable(offeringId: string, actor: string) {
    const offering = await this.offering(offeringId);
    await this.ensureBranchAccess(actor, offering.branchId);
    const profile = await this.effectiveProfile(offeringId, actor);
    const assignments = await this.prisma.timetableAssignment.findMany({
      where: { academicOfferingId: offeringId, timetableProfileId: profile.id },
      include: {
        timetableSlot: true,
        subject: true,
        staffProfile: { include: { user: { select: { fullName: true } } } },
      },
    });
    return {
      offering,
      profile,
      rows: profile.slots.map((slot) => ({
        ...slot,
        assignment:
          assignments.find((item) => item.timetableSlotId === slot.id) ?? null,
      })),
    };
  }

  async teacherTimetable(staffProfileId: string, actor: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffProfileId },
    });
    if (!staff) throw new NotFoundException('Teacher not found');
    const access = await this.prisma.roleAssignment.findFirst({
      where: {
        userId: actor,
        OR: [{ branchId: null }, { branchId: { not: null } }],
      },
    });
    if (!access)
      throw new ForbiddenException(
        'You do not have permission to view this teacher schedule',
      );
    return this.scheduleForTeacher(staffProfileId);
  }

  async myTimetable(userId: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });
    if (!staff) throw new NotFoundException('Staff profile not found');
    return this.scheduleForTeacher(staff.id);
  }

  private async scheduleForTeacher(staffProfileId: string) {
    const staff = await this.prisma.staffProfile.findUniqueOrThrow({
      where: { id: staffProfileId },
      include: {
        user: { include: { roleAssignments: { select: { branchId: true } } } },
      },
    });
    const branchIds = staff.user.roleAssignments.flatMap((assignment) =>
      assignment.branchId ? [assignment.branchId] : [],
    );
    const assignments = await this.prisma.timetableAssignment.findMany({
      where: {
        staffProfileId,
        timetableProfile: { isActive: true, deletedAt: null },
      },
      include: {
        timetableSlot: true,
        subject: true,
        academicOffering: {
          include: { branch: true, schoolClass: true, course: true },
        },
      },
    });
    const assignedRows = assignments.flatMap((assignment) =>
      this.daysFor(assignment.timetableSlot, assignment.timetableProfileId).map(
        (weekday) => ({
          entryType: 'TEACHING',
          weekday,
          periodNumber: assignment.timetableSlot.periodNumber,
          startsAt: assignment.timetableSlot.startsAt,
          endsAt: assignment.timetableSlot.endsAt,
          subject: assignment.subject,
          offering: assignment.academicOffering,
          branch: assignment.academicOffering.branch,
        }),
      ),
    );
    const branchProfiles = await this.prisma.timetableProfile.findMany({
      where: {
        branchId: { in: branchIds },
        scope: TimetableProfileScope.BRANCH,
        isActive: true,
        deletedAt: null,
      },
      include: { branch: true, slots: true },
    });
    const contextRows = branchProfiles.flatMap((profile) =>
      profile.slots.flatMap((slot) =>
        this.daysFor(slot, profile.id).flatMap((weekday) => {
          const overlapsTeaching = assignedRows.some(
            (row) =>
              row.weekday === weekday &&
              row.branch.id === profile.branchId &&
              minutes(row.startsAt) < minutes(slot.endsAt) &&
              minutes(slot.startsAt) < minutes(row.endsAt),
          );
          if (slot.slotType === TimetableSlotType.TEACHING) {
            if (overlapsTeaching) return [];
            return [
              {
                entryType: 'FREE',
                weekday,
                periodNumber: slot.periodNumber,
                startsAt: slot.startsAt,
                endsAt: slot.endsAt,
                branch: profile.branch,
              },
            ];
          }
          return [
            {
              entryType: slot.slotType,
              weekday,
              periodNumber: null,
              startsAt: slot.startsAt,
              endsAt: slot.endsAt,
              branch: profile.branch,
            },
          ];
        }),
      ),
    );
    return [...assignedRows, ...contextRows].sort(
      (a, b) =>
        a.weekday.localeCompare(b.weekday) ||
        a.startsAt.localeCompare(b.startsAt) ||
        a.branch.name.localeCompare(b.branch.name),
    );
  }

  private validateSlots(slots: TimetableSlotDto[], mode: TimetableMode) {
    const hasWeekdays = slots.some((slot) => slot.weekday);
    if (
      (mode === TimetableMode.SAME_DAILY && hasWeekdays) ||
      (mode === TimetableMode.DAY_SPECIFIC &&
        slots.some((slot) => !slot.weekday))
    )
      throw new BadRequestException(
        mode === TimetableMode.SAME_DAILY
          ? 'Same-daily profiles cannot attach slots to individual weekdays'
          : 'Day-specific profiles need a weekday for every slot',
      );
    const groups = new Map<string, TimetableSlotDto[]>();
    for (const slot of slots)
      groups.set(slot.weekday ?? 'DAILY', [
        ...(groups.get(slot.weekday ?? 'DAILY') ?? []),
        slot,
      ]);
    for (const [day, daySlots] of groups) {
      const ordered = [...daySlots].sort((a, b) =>
        a.startsAt.localeCompare(b.startsAt),
      );
      let previousEnd: string | undefined;
      let expectedPeriod = 1;
      for (const slot of ordered) {
        if (minutes(slot.startsAt) >= minutes(slot.endsAt))
          throw new BadRequestException(
            `${day}: every timetable slot must end after it starts`,
          );
        if (previousEnd && slot.startsAt !== previousEnd)
          throw new BadRequestException(
            `${day}: slots must be continuous; the schedule has a gap or overlap between ${previousEnd} and ${slot.startsAt}`,
          );
        if (slot.slotType === TimetableSlotType.TEACHING) {
          if (slot.periodNumber !== expectedPeriod)
            throw new BadRequestException(
              `${day}: teaching periods must be numbered sequentially from 1`,
            );
          expectedPeriod += 1;
        } else if (slot.periodNumber !== undefined)
          throw new BadRequestException(
            `${day}: only teaching slots may have a period number`,
          );
        previousEnd = slot.endsAt;
      }
    }
    return { slots, days: [...groups.keys()] };
  }

  private async validateProfileTarget(
    branchId: string,
    scope: TimetableProfileScope,
    offeringId?: string,
  ) {
    if (scope === TimetableProfileScope.BRANCH && offeringId)
      throw new BadRequestException(
        'A branch-wide profile cannot be attached to a class',
      );
    if (scope === TimetableProfileScope.CLASS_OVERRIDE && !offeringId)
      throw new BadRequestException(
        'A class override needs a class or section',
      );
    if (offeringId) {
      const offering = await this.offering(offeringId);
      if (offering.branchId !== branchId)
        throw new BadRequestException(
          'The selected class belongs to another branch',
        );
    }
  }

  private async validateAssignmentReferences(
    offeringId: string,
    branchId: string,
    dto: BulkSaveTimetableAssignmentsDto,
  ) {
    const subjectIds = [
      ...new Set(dto.assignments.map((item) => item.subjectId)),
    ];
    const teacherIds = [
      ...new Set(dto.assignments.map((item) => item.staffProfileId)),
    ];
    const [subjects, branchTeachers] = await Promise.all([
      this.prisma.academicOfferingSubject.count({
        where: {
          academicOfferingId: offeringId,
          subjectId: { in: subjectIds },
        },
      }),
      this.prisma.roleAssignment.count({
        where: { branchId, user: { staffProfile: { id: { in: teacherIds } } } },
      }),
    ]);
    if (subjects !== subjectIds.length)
      throw new BadRequestException(
        'Every selected subject must belong to this class',
      );
    if (branchTeachers < teacherIds.length)
      throw new BadRequestException(
        'One or more teachers are not assigned to this branch',
      );
  }

  private async findTeacherConflicts(
    offeringId: string,
    profileId: string,
    items: BulkSaveTimetableAssignmentsDto['assignments'],
    slots: {
      id: string;
      weekday: Weekday | null;
      startsAt: string;
      endsAt: string;
    }[],
  ) {
    const staffIds = [...new Set(items.map((item) => item.staffProfileId))];
    const existing = await this.prisma.timetableAssignment.findMany({
      where: {
        staffProfileId: { in: staffIds },
        academicOfferingId: { not: offeringId },
        timetableProfile: { isActive: true, deletedAt: null },
      },
      include: {
        timetableSlot: true,
        staffProfile: { include: { user: { select: { fullName: true } } } },
        academicOffering: { include: { schoolClass: true, course: true } },
      },
    });
    const conflicts: {
      assignmentId: string;
      teacherName: string;
      weekday: Weekday;
      className: string;
      periodNumber: number | null;
      startsAt: string;
      endsAt: string;
    }[] = [];
    for (const item of items) {
      const slot = slots.find(
        (candidate) => candidate.id === item.timetableSlotId,
      )!;
      for (const other of existing.filter(
        (candidate) => candidate.staffProfileId === item.staffProfileId,
      )) {
        const sameDay = this.daysFor(slot, profileId).some((day) =>
          this.daysFor(other.timetableSlot, other.timetableProfileId).includes(
            day,
          ),
        );
        if (
          sameDay &&
          minutes(slot.startsAt) < minutes(other.timetableSlot.endsAt) &&
          minutes(other.timetableSlot.startsAt) < minutes(slot.endsAt)
        )
          for (const weekday of this.daysFor(slot, profileId).filter((day) =>
            this.daysFor(
              other.timetableSlot,
              other.timetableProfileId,
            ).includes(day),
          ))
            conflicts.push({
              assignmentId: other.id,
              teacherName: other.staffProfile.user.fullName,
              weekday,
              className:
                other.academicOffering.schoolClass?.name ??
                other.academicOffering.course?.name ??
                'another class',
              periodNumber: other.timetableSlot.periodNumber,
              startsAt: other.timetableSlot.startsAt,
              endsAt: other.timetableSlot.endsAt,
            });
      }
    }
    return Array.from(
      new Map(
        conflicts.map((conflict) => [conflict.assignmentId, conflict]),
      ).values(),
    );
  }

  private daysFor(slot: { weekday: Weekday | null }, _profileId: string) {
    return slot.weekday ? [slot.weekday] : SCHOOL_DAYS;
  }
  private slotData(slot: TimetableSlotDto) {
    return {
      weekday: slot.weekday,
      slotType: slot.slotType,
      periodNumber: slot.periodNumber,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
    };
  }
  private async profileDetails(id: string) {
    return this.prisma.timetableProfile.findUniqueOrThrow({
      where: { id },
      include: {
        academicOffering: { include: { schoolClass: true, course: true } },
        slots: { orderBy: [{ weekday: 'asc' }, { startsAt: 'asc' }] },
      },
    });
  }
  private async profile(id: string) {
    const profile = await this.prisma.timetableProfile.findFirst({
      where: { id, deletedAt: null },
    });
    if (!profile) throw new NotFoundException('Timetable profile not found');
    return profile;
  }
  private async offering(id: string) {
    const offering = await this.prisma.academicOffering.findFirst({
      where: { id, status: EntityStatus.ACTIVE },
    });
    if (!offering)
      throw new NotFoundException('Active class or section not found');
    return offering;
  }
  private async validateProfileAssignments(profileId: string) {
    const profile = await this.prisma.timetableProfile.findUniqueOrThrow({
      where: { id: profileId },
      include: { slots: true },
    });
    this.validateSlots(
      profile.slots.map((slot) => ({
        ...slot,
        weekday: slot.weekday ?? undefined,
        periodNumber: slot.periodNumber ?? undefined,
      })),
      profile.timetableMode,
    );
  }
  private async ensureBranchAccess(userId: string, branchId: string) {
    const access = await this.prisma.roleAssignment.findFirst({
      where: { userId, OR: [{ branchId: null }, { branchId }] },
    });
    if (!access)
      throw new ForbiddenException('You do not have access to this branch');
  }
  private async recordAudit(
    actorUserId: string,
    action: AuditAction,
    entityId: string,
    changes: object,
  ) {
    const organization = await this.prisma.organization.findFirstOrThrow();
    await this.audit.record({
      organizationId: organization.id,
      actorUserId,
      action,
      entityType: 'TimetableProfile',
      entityId,
      changes: changes,
    });
  }
}
