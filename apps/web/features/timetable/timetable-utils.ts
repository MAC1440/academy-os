import type { TimetableSlotInput, TimetableWeekday } from './timetable.api';
import type { ApiRecord } from '@web/store/api/base-api';

export const timetableWeekdays: TimetableWeekday[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

export type TimetableBreakRule = {
  id: string;
  afterPeriod: number;
  durationMinutes: number;
};

export type AutomaticTimelineConfig = {
  startsAt: string;
  endsAt: string;
  teachingPeriodCount: number;
  assemblyEnabled: boolean;
  assemblyDurationMinutes: number;
  breaks: TimetableBreakRule[];
};

export const defaultAutomaticTimelineConfig = (): AutomaticTimelineConfig => ({
  startsAt: '07:30',
  endsAt: '14:00',
  teachingPeriodCount: 9,
  assemblyEnabled: true,
  assemblyDurationMinutes: 10,
  breaks: [{ id: 'default-break', afterPeriod: 5, durationMinutes: 20 }],
});

export function minutesFromTime(value: string) {
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(value: number) {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, value));
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

export function slotDurationMinutes(slot: Pick<TimetableSlotInput, 'startsAt' | 'endsAt'>) {
  return Math.max(0, minutesFromTime(slot.endsAt) - minutesFromTime(slot.startsAt));
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function timelineBalanceMinutes(slots: TimetableSlotInput[], targetEndsAt: string) {
  const last = [...slots].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).at(-1);
  if (!last) return minutesFromTime(targetEndsAt);
  return minutesFromTime(targetEndsAt) - minutesFromTime(last.endsAt);
}

export function reflowTimeline(
  slots: TimetableSlotInput[],
  startsAt: string,
  durationOverrides?: Record<number, number>,
) {
  let cursor = minutesFromTime(startsAt);
  let periodNumber = 0;
  return slots.map((slot, index) => {
    const duration = Math.max(
      1,
      durationOverrides?.[index] ?? Math.max(1, slotDurationMinutes(slot)),
    );
    const next: TimetableSlotInput = {
      ...slot,
      startsAt: timeFromMinutes(cursor),
      endsAt: timeFromMinutes(cursor + duration),
      periodNumber: slot.slotType === 'TEACHING' ? ++periodNumber : undefined,
    };
    cursor += duration;
    return next;
  });
}

export function generateBalancedTimeline(
  config: AutomaticTimelineConfig,
  weekday?: TimetableWeekday,
) {
  const totalMinutes = minutesFromTime(config.endsAt) - minutesFromTime(config.startsAt);
  const fixedMinutes =
    (config.assemblyEnabled ? config.assemblyDurationMinutes : 0) +
    config.breaks.reduce((sum, item) => sum + item.durationMinutes, 0);
  const teachingMinutes = totalMinutes - fixedMinutes;
  if (config.teachingPeriodCount < 1 || teachingMinutes < config.teachingPeriodCount)
    return {
      slots: [] as TimetableSlotInput[],
      error: 'The school day is too short for these periods and breaks.',
    };

  const baseDuration = Math.floor(teachingMinutes / config.teachingPeriodCount);
  let remainder = teachingMinutes % config.teachingPeriodCount;
  let cursor = minutesFromTime(config.startsAt);
  const slots: TimetableSlotInput[] = [];
  const append = (
    slotType: TimetableSlotInput['slotType'],
    durationMinutes: number,
    periodNumber?: number,
  ) => {
    slots.push({
      weekday,
      slotType,
      periodNumber,
      startsAt: timeFromMinutes(cursor),
      endsAt: timeFromMinutes(cursor + durationMinutes),
    });
    cursor += durationMinutes;
  };
  if (config.assemblyEnabled) append('ASSEMBLY', config.assemblyDurationMinutes);
  const orderedBreaks = [...config.breaks].sort((a, b) => a.afterPeriod - b.afterPeriod);
  for (let period = 1; period <= config.teachingPeriodCount; period += 1) {
    const duration = baseDuration + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
    append('TEACHING', duration, period);
    for (const breakRule of orderedBreaks.filter((item) => item.afterPeriod === period))
      append('BREAK', breakRule.durationMinutes);
  }
  return { slots, error: null as string | null };
}

export function preserveSlotIds(previous: TimetableSlotInput[], generated: TimetableSlotInput[]) {
  const occurrence = new Map<string, number>();
  const previousByKey = new Map<string, TimetableSlotInput>();
  for (const slot of previous) {
    const base = `${slot.weekday ?? 'DAILY'}:${slot.slotType}:${slot.periodNumber ?? 'none'}`;
    const count = occurrence.get(base) ?? 0;
    occurrence.set(base, count + 1);
    previousByKey.set(`${base}:${count}`, slot);
  }
  occurrence.clear();
  return generated.map((slot) => {
    const base = `${slot.weekday ?? 'DAILY'}:${slot.slotType}:${slot.periodNumber ?? 'none'}`;
    const count = occurrence.get(base) ?? 0;
    occurrence.set(base, count + 1);
    return { ...slot, id: previousByKey.get(`${base}:${count}`)?.id };
  });
}

export function slotsForDay(slots: TimetableSlotInput[], day?: TimetableWeekday) {
  return slots
    .filter((slot) => (day ? slot.weekday === day : !slot.weekday))
    .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function timetableDayLabel(day?: TimetableWeekday) {
  return day ? `${day[0]}${day.slice(1).toLowerCase()}` : 'Daily timeline';
}

export function offeringTitle(offering?: ApiRecord | null) {
  if (!offering) return 'Class';
  const title =
    (offering.schoolClass as ApiRecord | undefined)?.name ??
    (offering.course as ApiRecord | undefined)?.name ??
    'Class';
  return `${String(title)}${offering.sectionName ? ` · Section ${String(offering.sectionName)}` : ''}`;
}
