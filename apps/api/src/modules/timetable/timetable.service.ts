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
  Prisma,
  TimetableMode,
  TimetableProfileScope,
  TimetableSlotType,
  Weekday,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  BulkSaveTimetableAssignmentsDto,
  CreateTimetableDailyOverrideDto,
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

  preview(dto: TimetablePreviewDto) {
    return this.validateSlots(dto.slots, dto.timetableMode);
  }

  async listProfiles(branchId: string, actor: string) {
    await this.ensureBranchAccess(actor, branchId);
    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });
    return this.prisma.timetableProfile.findMany({
      where: {
        organizationId: branch.organizationId,
        deletedAt: null,
        OR: [{ scope: TimetableProfileScope.ORGANIZATION }, { branchId }],
      },
      include: {
        branch: true,
        academicOffering: { include: { schoolClass: true, course: true } },
        slots: true,
        _count: { select: { assignments: true } },
      },
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
    });
  }

  async listAllProfiles(actor: string) {
    const organization = await this.organizationFor(actor);
    return this.prisma.timetableProfile.findMany({
      where: { organizationId: organization.id, deletedAt: null },
      include: {
        branch: true,
        academicOffering: { include: { schoolClass: true, course: true } },
        slots: { orderBy: [{ weekday: 'asc' }, { startsAt: 'asc' }] },
        _count: { select: { assignments: true } },
      },
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
    });
  }

  async getProfile(profileId: string, actor: string) {
    const profile = await this.profile(profileId);
    await this.ensureProfileAccess(actor, profile);
    return this.profileDetails(profileId);
  }

  async createOrganizationProfile(
    dto: CreateTimetableProfileDto,
    actor: string,
  ) {
    const organization = await this.organizationFor(actor);
    if (dto.scope !== TimetableProfileScope.ORGANIZATION)
      throw new BadRequestException(
        'This endpoint creates organization-wide timetable profiles only',
      );
    await this.validateProfileTarget(
      organization.id,
      undefined,
      dto.scope,
      dto.academicOfferingId,
    );
    return this.createValidatedProfile(organization.id, undefined, dto, actor);
  }

  async createProfile(
    branchId: string,
    dto: CreateTimetableProfileDto,
    actor: string,
  ) {
    await this.ensureBranchAccess(actor, branchId);
    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });
    await this.validateProfileTarget(
      branch.organizationId,
      branchId,
      dto.scope,
      dto.academicOfferingId,
    );
    return this.createValidatedProfile(
      branch.organizationId,
      branchId,
      dto,
      actor,
    );
  }

  private async createValidatedProfile(
    organizationId: string,
    branchId: string | undefined,
    dto: CreateTimetableProfileDto,
    actor: string,
  ) {
    this.validateSlots(dto.slots, dto.timetableMode);
    const profile = await this.prisma.timetableProfile.create({
      data: {
        organizationId,
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
      organizationId,
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
    await this.ensureProfileAccess(actor, profile);
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
      if (dto.slots) await this.syncSlots(tx, profile.id, dto.slots);
    });
    await this.recordAudit(actor, AuditAction.UPDATE, profile.id, dto);
    return this.profileDetails(profile.id);
  }

  async setProfileActive(profileId: string, isActive: boolean, actor: string) {
    const profile = await this.profile(profileId);
    await this.ensureProfileAccess(actor, profile);
    if (isActive) await this.validateProfileAssignments(profile.id);
    await this.prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.timetableProfile.updateMany({
          where:
            profile.scope === TimetableProfileScope.ORGANIZATION
              ? {
                  organizationId: profile.organizationId,
                  scope: TimetableProfileScope.ORGANIZATION,
                  deletedAt: null,
                }
              : profile.scope === TimetableProfileScope.BRANCH
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
    await this.ensureProfileAccess(actor, profile);
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
      })) ??
      (await this.prisma.timetableProfile.findFirst({
        where: {
          organizationId: offering.branch.organizationId,
          scope: TimetableProfileScope.ORGANIZATION,
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
    const assignmentSlotIds = dto.assignments.map(
      (item) => item.timetableSlotId,
    );
    const clearedSlotIds = dto.clearedTimetableSlotIds ?? [];
    const changedSlotIds = [...assignmentSlotIds, ...clearedSlotIds];
    if (new Set(changedSlotIds).size !== changedSlotIds.length)
      throw new BadRequestException(
        'A teaching period can be updated or cleared only once per request',
      );
    const slots = await this.prisma.timetableSlot.findMany({
      where: { id: { in: changedSlotIds }, timetableProfileId: profileId },
    });
    if (
      slots.length !== changedSlotIds.length ||
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
      if (clearedSlotIds.length)
        await tx.timetableAssignment.deleteMany({
          where: {
            academicOfferingId: offeringId,
            timetableProfileId: profileId,
            timetableSlotId: { in: clearedSlotIds },
          },
        });
      for (const item of dto.assignments)
        await tx.timetableAssignment.upsert({
          where: {
            academicOfferingId_timetableSlotId: {
              academicOfferingId: offeringId,
              timetableSlotId: item.timetableSlotId,
            },
          },
          create: {
            branchId: offering.branchId,
            academicOfferingId: offeringId,
            timetableProfileId: profileId,
            timetableSlotId: item.timetableSlotId,
            subjectId: item.subjectId,
            staffProfileId: item.staffProfileId,
          },
          update: {
            timetableProfileId: profileId,
            subjectId: item.subjectId,
            staffProfileId: item.staffProfileId,
          },
        });
    });
    await this.recordAudit(actor, AuditAction.UPDATE, profileId, {
      offeringId,
      updatedAssignments: dto.assignments.length,
      clearedAssignments: clearedSlotIds.length,
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

  async listDailyOverrides(branchId: string, date: string, actor: string) {
    await this.ensureBranchAccess(actor, branchId);
    const overrideDate = this.asDate(date);
    return this.prisma.timetableDailyOverride.findMany({
      where: { overrideDate, timetableAssignment: { branchId } },
      include: {
        overrideStaffProfile: {
          include: { user: { select: { fullName: true } } },
        },
        timetableAssignment: {
          include: {
            timetableSlot: true,
            subject: true,
            staffProfile: { include: { user: { select: { fullName: true } } } },
            academicOffering: { include: { schoolClass: true, course: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createDailyOverride(
    dto: CreateTimetableDailyOverrideDto,
    actor: string,
  ) {
    const assignment = await this.prisma.timetableAssignment.findUnique({
      where: { id: dto.timetableAssignmentId },
      include: { timetableSlot: true, timetableProfile: true },
    });
    if (!assignment) throw new NotFoundException('Timetable period not found');
    await this.ensureBranchAccess(actor, assignment.branchId);
    const overrideDate = this.asDate(dto.overrideDate);
    const weekday = this.weekdayFor(overrideDate);
    if (!this.daysFor(assignment.timetableSlot).includes(weekday))
      throw new BadRequestException(
        'This class is not scheduled for the selected date',
      );
    const substitute = await this.prisma.staffProfile.findUnique({
      where: { id: dto.overrideStaffProfileId },
      include: {
        user: { include: { roleAssignments: { select: { branchId: true } } } },
      },
    });
    if (
      !substitute ||
      !substitute.user.roleAssignments.some(
        (item) => item.branchId === assignment.branchId,
      )
    )
      throw new BadRequestException('Choose a teacher assigned to this campus');
    await this.ensureTeacherIsFree(
      substitute.id,
      assignment.id,
      assignment.branchId,
      overrideDate,
      assignment.timetableSlot.startsAt,
      assignment.timetableSlot.endsAt,
    );
    const override = await this.prisma.timetableDailyOverride.upsert({
      where: {
        timetableAssignmentId_overrideDate: {
          timetableAssignmentId: assignment.id,
          overrideDate,
        },
      },
      create: {
        timetableAssignmentId: assignment.id,
        overrideStaffProfileId: substitute.id,
        overrideDate,
        createdByUserId: actor,
      },
      update: { overrideStaffProfileId: substitute.id, createdByUserId: actor },
    });
    await this.recordAudit(actor, AuditAction.UPDATE, override.id, {
      type: 'TIMETABLE_DAILY_OVERRIDE',
      timetableAssignmentId: assignment.id,
      overrideDate: dto.overrideDate,
      overrideStaffProfileId: substitute.id,
    });
    return override;
  }

  async removeDailyOverride(overrideId: string, actor: string) {
    const override = await this.prisma.timetableDailyOverride.findUnique({
      where: { id: overrideId },
      include: { timetableAssignment: true },
    });
    if (!override)
      throw new NotFoundException('Daily timetable cover not found');
    await this.ensureBranchAccess(actor, override.timetableAssignment.branchId);
    await this.prisma.timetableDailyOverride.delete({
      where: { id: override.id },
    });
    await this.recordAudit(actor, AuditAction.DELETE, override.id, {
      type: 'TIMETABLE_DAILY_OVERRIDE',
    });
    return { id: override.id };
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

  async myTimetable(userId: string, weekOf?: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });
    if (!staff) throw new NotFoundException('Staff profile not found');
    return this.scheduleForTeacher(staff.id, weekOf);
  }

  private async scheduleForTeacher(staffProfileId: string, weekOf?: string) {
    const staff = await this.prisma.staffProfile.findUniqueOrThrow({
      where: { id: staffProfileId },
      include: {
        user: { include: { roleAssignments: { select: { branchId: true } } } },
      },
    });
    const branchIds = staff.user.roleAssignments.flatMap((assignment) =>
      assignment.branchId ? [assignment.branchId] : [],
    );
    const dates = this.schoolWeek(weekOf);
    const assignments = await this.prisma.timetableAssignment.findMany({
      where: {
        branchId: { in: branchIds },
        timetableProfile: { isActive: true, deletedAt: null },
      },
      include: {
        timetableSlot: true,
        subject: true,
        academicOffering: {
          include: { branch: true, schoolClass: true, course: true },
        },
        dailyOverrides: { where: { overrideDate: { in: dates } } },
      },
    });
    const assignedRows = assignments.flatMap((assignment) =>
      dates.flatMap((date) => {
        const weekday = this.weekdayFor(date);
        if (!this.daysFor(assignment.timetableSlot).includes(weekday))
          return [];
        const dailyOverride = assignment.dailyOverrides[0];
        if (
          (dailyOverride?.overrideStaffProfileId ??
            assignment.staffProfileId) !== staffProfileId
        )
          return [];
        return [
          {
            entryType: 'TEACHING',
            date: this.dateKey(date),
            weekday,
            periodNumber: assignment.timetableSlot.periodNumber,
            startsAt: assignment.timetableSlot.startsAt,
            endsAt: assignment.timetableSlot.endsAt,
            subject: assignment.subject,
            offering: assignment.academicOffering,
            branch: assignment.academicOffering.branch,
          },
        ];
      }),
    );
    const branches = await this.prisma.branch.findMany({
      where: {
        id: { in: branchIds },
        deletedAt: null,
      },
      include: {
        timetableProfiles: {
          where: {
            scope: TimetableProfileScope.BRANCH,
            isActive: true,
            deletedAt: null,
          },
          include: { slots: true },
          take: 1,
        },
      },
    });
    const organizationIds = [
      ...new Set(branches.map((branch) => branch.organizationId)),
    ];
    const organizationProfiles = await this.prisma.timetableProfile.findMany({
      where: {
        organizationId: { in: organizationIds },
        scope: TimetableProfileScope.ORGANIZATION,
        isActive: true,
        deletedAt: null,
      },
      include: { slots: true },
    });
    const scheduleContexts = branches.flatMap((branch) => {
      const profile =
        branch.timetableProfiles[0] ??
        organizationProfiles.find(
          (candidate) => candidate.organizationId === branch.organizationId,
        );
      return profile ? [{ branch, slots: profile.slots }] : [];
    });
    const contextRows = scheduleContexts.flatMap((context) =>
      context.slots.flatMap((slot) =>
        dates.flatMap((date) => {
          const weekday = this.weekdayFor(date);
          if (!this.daysFor(slot).includes(weekday)) return [];
          const overlapsTeaching = assignedRows.some(
            (row) =>
              row.date === this.dateKey(date) &&
              row.branch.id === context.branch.id &&
              minutes(row.startsAt) < minutes(slot.endsAt) &&
              minutes(slot.startsAt) < minutes(row.endsAt),
          );
          if (slot.slotType === TimetableSlotType.TEACHING) {
            if (overlapsTeaching) return [];
            return [
              {
                entryType: 'FREE',
                date: this.dateKey(date),
                weekday,
                periodNumber: slot.periodNumber,
                startsAt: slot.startsAt,
                endsAt: slot.endsAt,
                branch: context.branch,
              },
            ];
          }
          return [
            {
              entryType: slot.slotType,
              date: this.dateKey(date),
              weekday,
              periodNumber: null,
              startsAt: slot.startsAt,
              endsAt: slot.endsAt,
              branch: context.branch,
            },
          ];
        }),
      ),
    );
    return [...assignedRows, ...contextRows].sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
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
        } else if (slot.periodNumber != null)
          throw new BadRequestException(
            `${day}: only teaching slots may have a period number`,
          );
        previousEnd = slot.endsAt;
      }
      const assemblies = ordered.filter(
        (slot) => slot.slotType === TimetableSlotType.ASSEMBLY,
      );
      if (assemblies.length > 1)
        throw new BadRequestException(
          `${day}: a timetable can contain only one assembly`,
        );
      if (
        assemblies.length === 1 &&
        ordered[0]?.slotType !== TimetableSlotType.ASSEMBLY
      )
        throw new BadRequestException(
          `${day}: assembly must be the first timetable entry`,
        );
    }
    return { slots, days: [...groups.keys()] };
  }

  private async validateProfileTarget(
    organizationId: string,
    branchId: string | undefined,
    scope: TimetableProfileScope,
    offeringId?: string,
  ) {
    if (scope === TimetableProfileScope.ORGANIZATION) {
      if (branchId || offeringId)
        throw new BadRequestException(
          'An organization timetable cannot be attached to a campus or class',
        );
      return;
    }
    if (!branchId)
      throw new BadRequestException(
        'Campus and class timetable overrides require a campus',
      );
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, organizationId, deletedAt: null },
    });
    if (!branch)
      throw new BadRequestException(
        'The selected campus does not belong to this organization',
      );
    if (scope === TimetableProfileScope.BRANCH && offeringId)
      throw new BadRequestException(
        'A campus-wide profile cannot be attached to a class',
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
        const sameDay = this.daysFor(slot).some((day) =>
          this.daysFor(other.timetableSlot).includes(day),
        );
        if (
          sameDay &&
          minutes(slot.startsAt) < minutes(other.timetableSlot.endsAt) &&
          minutes(other.timetableSlot.startsAt) < minutes(slot.endsAt)
        )
          for (const weekday of this.daysFor(slot).filter((day) =>
            this.daysFor(other.timetableSlot).includes(day),
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

  private async ensureTeacherIsFree(
    staffProfileId: string,
    excludedAssignmentId: string,
    branchId: string,
    overrideDate: Date,
    startsAt: string,
    endsAt: string,
  ) {
    const weekday = this.weekdayFor(overrideDate);
    const assignments = await this.prisma.timetableAssignment.findMany({
      where: {
        branchId,
        timetableProfile: { isActive: true, deletedAt: null },
      },
      include: {
        timetableSlot: true,
        dailyOverrides: { where: { overrideDate } },
      },
    });
    const conflict = assignments.some((assignment) => {
      if (assignment.id === excludedAssignmentId) return false;
      if (!this.daysFor(assignment.timetableSlot).includes(weekday))
        return false;
      const effectiveStaffId =
        assignment.dailyOverrides[0]?.overrideStaffProfileId ??
        assignment.staffProfileId;
      return (
        effectiveStaffId === staffProfileId &&
        minutes(assignment.timetableSlot.startsAt) < minutes(endsAt) &&
        minutes(startsAt) < minutes(assignment.timetableSlot.endsAt)
      );
    });
    if (conflict)
      throw new ConflictException(
        'This teacher is already teaching during the selected period on that date',
      );
  }

  private asDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new BadRequestException('Choose a valid calendar date');
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.valueOf()) || this.dateKey(date) !== value)
      throw new BadRequestException('Choose a valid calendar date');
    return date;
  }

  private schoolWeek(reference?: string) {
    const date = reference ? this.asDate(reference) : this.pakistanToday();
    if (!reference && date.getUTCDay() === 0)
      date.setUTCDate(date.getUTCDate() + 1);
    const offset = (date.getUTCDay() + 6) % 7;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - offset);
    return Array.from({ length: 6 }, (_, index) => {
      const day = new Date(monday);
      day.setUTCDate(monday.getUTCDate() + index);
      return day;
    });
  }

  private pakistanToday() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const value = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return this.asDate(`${value.year}-${value.month}-${value.day}`);
  }

  private dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private weekdayFor(date: Date) {
    return [
      Weekday.SUNDAY,
      Weekday.MONDAY,
      Weekday.TUESDAY,
      Weekday.WEDNESDAY,
      Weekday.THURSDAY,
      Weekday.FRIDAY,
      Weekday.SATURDAY,
    ][date.getUTCDay()]!;
  }

  private daysFor(slot: { weekday: Weekday | null }) {
    return slot.weekday ? [slot.weekday] : SCHOOL_DAYS;
  }
  private slotData(slot: TimetableSlotDto) {
    return {
      weekday: slot.weekday ?? null,
      slotType: slot.slotType,
      periodNumber:
        slot.slotType === TimetableSlotType.TEACHING ? slot.periodNumber : null,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
    };
  }
  private async profileDetails(id: string) {
    return this.prisma.timetableProfile.findUniqueOrThrow({
      where: { id },
      include: {
        organization: true,
        branch: true,
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
      include: { branch: true },
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
  private async organizationFor(userId: string) {
    const access = await this.prisma.roleAssignment.findFirst({
      where: { userId },
      include: { role: { select: { organizationId: true } } },
    });
    if (!access)
      throw new ForbiddenException(
        'You do not have access to organization timetables',
      );
    return this.prisma.organization.findUniqueOrThrow({
      where: { id: access.role.organizationId },
    });
  }
  private async ensureProfileAccess(
    userId: string,
    profile: { branchId: string | null },
  ) {
    if (profile.branchId)
      return this.ensureBranchAccess(userId, profile.branchId);
    await this.organizationFor(userId);
  }
  private async syncSlots(
    tx: Prisma.TransactionClient,
    profileId: string,
    slots: TimetableSlotDto[],
  ) {
    const existing = await tx.timetableSlot.findMany({
      where: { timetableProfileId: profileId },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((slot) => slot.id));
    const suppliedIds = slots.flatMap((slot) => (slot.id ? [slot.id] : []));
    if (
      new Set(suppliedIds).size !== suppliedIds.length ||
      suppliedIds.some((id) => !existingIds.has(id))
    )
      throw new BadRequestException(
        'One or more timetable slots do not belong to this profile',
      );

    // Release teaching-period uniqueness before renumbering retained rows.
    await tx.timetableSlot.updateMany({
      where: { timetableProfileId: profileId },
      data: { periodNumber: null },
    });
    for (const slot of slots) {
      if (slot.id)
        await tx.timetableSlot.update({
          where: { id: slot.id },
          data: this.slotData(slot),
        });
      else
        await tx.timetableSlot.create({
          data: { timetableProfileId: profileId, ...this.slotData(slot) },
        });
    }
    const removedIds = existing
      .map((slot) => slot.id)
      .filter((id) => !suppliedIds.includes(id));
    if (removedIds.length)
      await tx.timetableSlot.deleteMany({ where: { id: { in: removedIds } } });
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
