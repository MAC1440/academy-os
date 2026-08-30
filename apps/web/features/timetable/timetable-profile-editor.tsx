'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import {
  type TimetableMode,
  type TimetableProfilePayload,
  type TimetableScope,
  type TimetableSlotInput,
  type TimetableWeekday,
  useCreateOrganizationTimetableProfileMutation,
  useCreateTimetableProfileMutation,
  useGetTimetableProfileQuery,
  useUpdateTimetableProfileMutation,
} from './timetable.api';
import {
  defaultAutomaticTimelineConfig,
  formatDuration,
  generateBalancedTimeline,
  offeringTitle,
  preserveSlotIds,
  reflowTimeline,
  slotDurationMinutes,
  slotsForDay,
  timetableDayLabel,
  timetableWeekdays,
  timelineBalanceMinutes,
  type AutomaticTimelineConfig,
} from './timetable-utils';

type Method = 'AUTOMATIC' | 'MANUAL';

function normalizeSlots(slots: TimetableSlotInput[]) {
  return slots.map((slot) => ({
    ...slot,
    periodNumber: slot.periodNumber ?? undefined,
    weekday: slot.weekday ?? undefined,
  }));
}

function continuityError(slots: TimetableSlotInput[]) {
  const ordered = [...slots].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index]!;
    if (current.startsAt >= current.endsAt) return 'Every entry must end after it starts.';
    if (index > 0 && ordered[index - 1]!.endsAt !== current.startsAt)
      return 'Remove the gap or overlap between entries.';
  }
  return null;
}

export function TimetableProfileEditor({ profileId }: { profileId?: string }) {
  const toast = useToast();
  const router = useRouter();
  const editing = Boolean(profileId);
  const profileQuery = useGetTimetableProfileQuery(profileId || skipToken);
  const { data: branches = [] } = useListBranchesQuery();
  const [name, setName] = useState('Standard school day');
  const [scope, setScope] = useState<TimetableScope>('ORGANIZATION');
  const [branchId, setBranchId] = useState('');
  const [offeringId, setOfferingId] = useState('');
  const [mode, setMode] = useState<TimetableMode>('SAME_DAILY');
  const [method, setMethod] = useState<Method>('AUTOMATIC');
  const [config, setConfig] = useState<AutomaticTimelineConfig>(defaultAutomaticTimelineConfig);
  const initial = generateBalancedTimeline(defaultAutomaticTimelineConfig()).slots;
  const [slots, setSlots] = useState<TimetableSlotInput[]>(initial);
  const [selectedDay, setSelectedDay] = useState<TimetableWeekday>('MONDAY');
  const [targetEnds, setTargetEnds] = useState<Record<string, string>>({ DAILY: '14:00' });
  const offeringsQuery = useListOfferingsQuery(branchId || skipToken);
  const [createOrganization, createOrganizationState] =
    useCreateOrganizationTimetableProfileMutation();
  const [createCampus, createCampusState] = useCreateTimetableProfileMutation();
  const [update, updateState] = useUpdateTimetableProfileMutation();

  useEffect(() => {
    const profile = profileQuery.data;
    if (!profile) return;
    const normalized = normalizeSlots(profile.slots);
    setName(profile.name);
    setScope(profile.scope);
    setBranchId(profile.branchId ?? '');
    setOfferingId(profile.academicOfferingId ?? '');
    setMode(profile.timetableMode);
    setMethod('MANUAL');
    setSlots(normalized);
    const ends: Record<string, string> = {};
    const days = profile.timetableMode === 'DAY_SPECIFIC' ? timetableWeekdays : [undefined];
    for (const day of days)
      ends[day ?? 'DAILY'] = slotsForDay(normalized, day).at(-1)?.endsAt ?? '14:00';
    setTargetEnds(ends);
  }, [profileQuery.data]);

  const activeDay = mode === 'DAY_SPECIFIC' ? selectedDay : undefined;
  const daySlots = useMemo(() => slotsForDay(slots, activeDay), [activeDay, slots]);
  const targetEnd = targetEnds[activeDay ?? 'DAILY'] ?? config.endsAt;
  const balance = timelineBalanceMinutes(daySlots, targetEnd);
  const timelineError = continuityError(daySlots);
  const saving =
    createOrganizationState.isLoading || createCampusState.isLoading || updateState.isLoading;

  function replaceDay(next: TimetableSlotInput[]) {
    setSlots((current) => [
      ...current.filter((slot) => (activeDay ? slot.weekday !== activeDay : Boolean(slot.weekday))),
      ...next,
    ]);
  }

  function generate() {
    const result = generateBalancedTimeline(
      config,
      mode === 'DAY_SPECIFIC' ? selectedDay : undefined,
    );
    if (result.error) return toast.error(result.error);
    if (mode === 'SAME_DAILY') {
      setSlots(preserveSlotIds(slots, result.slots));
      setTargetEnds({ DAILY: config.endsAt });
    } else {
      const generated = timetableWeekdays.flatMap((day) => {
        const dayResult = generateBalancedTimeline(config, day).slots;
        return preserveSlotIds(slotsForDay(slots, day), dayResult);
      });
      setSlots(generated);
      setTargetEnds(Object.fromEntries(timetableWeekdays.map((day) => [day, config.endsAt])));
    }
    toast.success('A balanced timeline is ready. You can adjust any entry below.');
  }

  function setDuration(index: number, duration: number) {
    replaceDay(
      reflowTimeline(daySlots, daySlots[0]?.startsAt ?? config.startsAt, {
        [index]: Math.max(1, duration),
      }),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= daySlots.length) return;
    const next = [...daySlots];
    const current = next[index]!;
    next[index] = next[destination]!;
    next[destination] = current;
    const assembly = next.findIndex((slot) => slot.slotType === 'ASSEMBLY');
    if (assembly > 0) return toast.error('Assembly must remain the first entry.');
    replaceDay(reflowTimeline(next, next[0]?.startsAt ?? config.startsAt));
  }

  function removeSlot(index: number) {
    replaceDay(
      reflowTimeline(
        daySlots.filter((_, itemIndex) => itemIndex !== index),
        daySlots[0]?.startsAt ?? config.startsAt,
      ),
    );
  }

  function addBreak() {
    const next = [
      ...daySlots,
      { slotType: 'BREAK' as const, startsAt: '00:00', endsAt: '00:10', weekday: activeDay },
    ];
    replaceDay(reflowTimeline(next, daySlots[0]?.startsAt ?? config.startsAt));
  }

  function setManualTime(index: number, key: 'startsAt' | 'endsAt', value: string) {
    replaceDay(
      daySlots.map((slot, itemIndex) => (itemIndex === index ? { ...slot, [key]: value } : slot)),
    );
  }

  function changeMode(nextMode: TimetableMode) {
    if (nextMode === mode) return;
    if (nextMode === 'DAY_SPECIFIC') {
      setSlots(
        timetableWeekdays.flatMap((day, dayIndex) =>
          daySlots.map((slot) => ({
            ...slot,
            id: dayIndex === 0 ? slot.id : undefined,
            weekday: day,
          })),
        ),
      );
      setTargetEnds(Object.fromEntries(timetableWeekdays.map((day) => [day, targetEnd])));
    } else {
      setSlots(slotsForDay(slots, selectedDay).map((slot) => ({ ...slot, weekday: undefined })));
      setTargetEnds({ DAILY: targetEnd });
    }
    setMode(nextMode);
  }

  const allDaysValid = (mode === 'DAY_SPECIFIC' ? timetableWeekdays : [undefined]).every((day) => {
    const rows = slotsForDay(slots, day);
    return (
      rows.length > 0 &&
      !continuityError(rows) &&
      timelineBalanceMinutes(rows, targetEnds[day ?? 'DAILY'] ?? config.endsAt) === 0
    );
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return toast.error('Give this timing profile a clear name.');
    if (scope !== 'ORGANIZATION' && !branchId)
      return toast.error('Choose the campus this override belongs to.');
    if (scope === 'CLASS_OVERRIDE' && !offeringId)
      return toast.error('Choose the class this override belongs to.');
    if (!allDaysValid)
      return toast.error(
        'Every timeline must be continuous and finish with a zero-minute balance.',
      );
    const body: TimetableProfilePayload = {
      name: name.trim(),
      scope,
      timetableMode: mode,
      academicOfferingId: scope === 'CLASS_OVERRIDE' ? offeringId : undefined,
      slots,
    };
    try {
      const saved = editing
        ? await update({
            profileId: profileId!,
            body: {
              ...body,
              branchId: scope === 'ORGANIZATION' ? undefined : branchId,
            },
          }).unwrap()
        : scope === 'ORGANIZATION'
          ? await createOrganization(body).unwrap()
          : await createCampus({ branchId, body }).unwrap();
      toast.success(
        editing ? 'Timing profile updated.' : 'Timing profile created. Activate it when ready.',
      );
      router.push(`/timetable/profiles/${saved.id}`);
    } catch (error) {
      const message = (error as { data?: { errors?: string[]; message?: string } }).data
        ?.errors?.[0];
      toast.error(
        message ?? 'The timing profile could not be saved. Check the timeline and try again.',
      );
    }
  }

  if (editing && profileQuery.isLoading)
    return <p className="text-sm text-muted-foreground">Loading timing profile…</p>;
  return (
    <form className="space-y-6" onSubmit={submit}>
      <Link
        href={profileId ? `/timetable/profiles/${profileId}` : '/timetable'}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Back
      </Link>
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
          {editing ? 'Edit timing profile' : 'New timing profile'}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[-.04em]">Build the school day</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Generate an even schedule or enter every time manually. Duration and remaining time update
          as you work.
        </p>
      </header>
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-medium md:col-span-2">
          Profile name
          <input
            className="field"
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Applies to
          <select
            className="field"
            value={scope}
            onChange={(event) => {
              const nextScope = event.target.value as TimetableScope;
              setScope(nextScope);
              if (nextScope === 'ORGANIZATION') {
                setBranchId('');
                setOfferingId('');
              } else if (nextScope === 'BRANCH') setOfferingId('');
            }}
          >
            <option value="ORGANIZATION">Entire organization</option>
            <option value="BRANCH">One campus</option>
            <option value="CLASS_OVERRIDE">One class</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Day pattern
          <select
            className="field"
            value={mode}
            onChange={(event) => changeMode(event.target.value as TimetableMode)}
          >
            <option value="SAME_DAILY">Same Monday–Saturday</option>
            <option value="DAY_SPECIFIC">Different by day</option>
          </select>
        </label>
        {scope !== 'ORGANIZATION' ? (
          <label className="grid gap-2 text-sm font-medium">
            Campus
            <select
              className="field"
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                setOfferingId('');
              }}
            >
              <option value="">Choose campus</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {String(branch.name)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {scope === 'CLASS_OVERRIDE' ? (
          <label className="grid gap-2 text-sm font-medium md:col-span-2">
            Class / course
            <select
              className="field"
              value={offeringId}
              onChange={(event) => setOfferingId(event.target.value)}
            >
              <option value="">Choose class or course</option>
              {(offeringsQuery.data ?? []).map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offeringTitle(offering)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      {!editing ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex gap-2">
            <button
              type="button"
              className={method === 'AUTOMATIC' ? 'button-primary' : 'button-secondary'}
              onClick={() => setMethod('AUTOMATIC')}
            >
              Generate evenly
            </button>
            <button
              type="button"
              className={method === 'MANUAL' ? 'button-primary' : 'button-secondary'}
              onClick={() => setMethod('MANUAL')}
            >
              Enter manually
            </button>
          </div>
          {method === 'AUTOMATIC' ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <label className="grid gap-2 text-sm font-medium">
                  School opens
                  <input
                    className="field"
                    type="time"
                    value={config.startsAt}
                    onChange={(event) => setConfig({ ...config, startsAt: event.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  School closes
                  <input
                    className="field"
                    type="time"
                    value={config.endsAt}
                    onChange={(event) => setConfig({ ...config, endsAt: event.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Teaching periods
                  <input
                    className="field"
                    type="number"
                    min={1}
                    max={20}
                    value={config.teachingPeriodCount}
                    onChange={(event) =>
                      setConfig({ ...config, teachingPeriodCount: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Assembly minutes
                  <input
                    className="field"
                    type="number"
                    min={1}
                    max={120}
                    disabled={!config.assemblyEnabled}
                    value={config.assemblyDurationMinutes}
                    onChange={(event) =>
                      setConfig({ ...config, assemblyDurationMinutes: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={config.assemblyEnabled}
                    onChange={(event) =>
                      setConfig({ ...config, assemblyEnabled: event.target.checked })
                    }
                  />{' '}
                  Include assembly
                </label>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Breaks</h3>
                  <button
                    type="button"
                    className="button-secondary inline-flex items-center gap-2 px-3 py-2"
                    onClick={() =>
                      setConfig({
                        ...config,
                        breaks: [
                          ...config.breaks,
                          {
                            id: crypto.randomUUID(),
                            afterPeriod: Math.min(5, config.teachingPeriodCount),
                            durationMinutes: 10,
                          },
                        ],
                      })
                    }
                  >
                    <Plus size={15} /> Add break
                  </button>
                </div>
                {config.breaks.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <label className="grid gap-1.5 text-sm">
                      After period
                      <input
                        className="field"
                        type="number"
                        min={1}
                        max={config.teachingPeriodCount}
                        value={item.afterPeriod}
                        onChange={(event) =>
                          setConfig({
                            ...config,
                            breaks: config.breaks.map((candidate) =>
                              candidate.id === item.id
                                ? { ...candidate, afterPeriod: Number(event.target.value) }
                                : candidate,
                            ),
                          })
                        }
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm">
                      Duration (minutes)
                      <input
                        className="field"
                        type="number"
                        min={1}
                        max={120}
                        value={item.durationMinutes}
                        onChange={(event) =>
                          setConfig({
                            ...config,
                            breaks: config.breaks.map((candidate) =>
                              candidate.id === item.id
                                ? { ...candidate, durationMinutes: Number(event.target.value) }
                                : candidate,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="self-end p-3 text-destructive"
                      aria-label="Remove break"
                      onClick={() =>
                        setConfig({
                          ...config,
                          breaks: config.breaks.filter((candidate) => candidate.id !== item.id),
                        })
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="button-primary" onClick={generate}>
                Generate balanced timeline
              </button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Use the timeline below to enter exact start and end times. Breaks can be added and
              moved anywhere; assembly remains first.
            </p>
          )}
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        {mode === 'DAY_SPECIFIC' ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {timetableWeekdays.map((day) => (
              <button
                type="button"
                key={day}
                className={
                  selectedDay === day
                    ? 'button-primary whitespace-nowrap'
                    : 'button-secondary whitespace-nowrap'
                }
                onClick={() => setSelectedDay(day)}
              >
                {timetableDayLabel(day)}
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{timetableDayLabel(activeDay)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Adjust durations to redistribute the day, or switch to exact manual times.
            </p>
          </div>
          <div
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${balance === 0 && !timelineError ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300'}`}
          >
            {timelineError ??
              (balance === 0
                ? 'Timeline fits exactly'
                : balance > 0
                  ? `${balance} minutes remaining`
                  : `${Math.abs(balance)} minutes over schedule`)}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <label className="grid gap-1.5 text-sm font-medium">
            Required closing time
            <input
              type="time"
              className="field"
              value={targetEnd}
              onChange={(event) =>
                setTargetEnds({ ...targetEnds, [activeDay ?? 'DAILY']: event.target.value })
              }
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Editing style
            <select
              className="field"
              value={method}
              onChange={(event) => setMethod(event.target.value as Method)}
            >
              <option value="AUTOMATIC">Adjust durations continuously</option>
              <option value="MANUAL">Enter exact start/end</option>
            </select>
          </label>
          <button
            type="button"
            className="button-secondary self-end inline-flex items-center gap-2"
            onClick={addBreak}
          >
            <Plus size={16} /> Add break
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="bg-muted/45 text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Entry</th>
                <th>Starts</th>
                <th>Ends</th>
                <th>Duration</th>
                <th className="px-4 text-right">Order</th>
              </tr>
            </thead>
            <tbody>
              {daySlots.map((slot, index) => (
                <tr
                  key={slot.id ?? `${slot.slotType}-${index}`}
                  className="border-t border-border/70"
                >
                  <td className="px-4 py-3 font-semibold">
                    {slot.slotType === 'TEACHING'
                      ? `Period ${slot.periodNumber}`
                      : slot.slotType === 'ASSEMBLY'
                        ? 'Assembly'
                        : 'Break'}
                  </td>
                  <td>
                    {method === 'MANUAL' ? (
                      <input
                        aria-label="Start time"
                        className="field w-32"
                        type="time"
                        value={slot.startsAt}
                        onChange={(event) => setManualTime(index, 'startsAt', event.target.value)}
                      />
                    ) : (
                      slot.startsAt
                    )}
                  </td>
                  <td>
                    {method === 'MANUAL' ? (
                      <input
                        aria-label="End time"
                        className="field w-32"
                        type="time"
                        value={slot.endsAt}
                        onChange={(event) => setManualTime(index, 'endsAt', event.target.value)}
                      />
                    ) : (
                      slot.endsAt
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label="Duration in minutes"
                        className="field w-24"
                        type="number"
                        min={1}
                        max={240}
                        disabled={method === 'MANUAL'}
                        value={slotDurationMinutes(slot)}
                        onChange={(event) => setDuration(index, Number(event.target.value))}
                      />
                      <span className="text-muted-foreground">
                        {formatDuration(slotDurationMinutes(slot))}
                      </span>
                    </div>
                  </td>
                  <td className="px-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="p-2 text-muted-foreground hover:text-foreground"
                        aria-label="Move up"
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="p-2 text-muted-foreground hover:text-foreground"
                        aria-label="Move down"
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      {slot.slotType !== 'TEACHING' ? (
                        <button
                          type="button"
                          className="p-2 text-destructive"
                          aria-label={`Remove ${slot.slotType.toLowerCase()}`}
                          onClick={() => removeSlot(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
        <Link
          href={profileId ? `/timetable/profiles/${profileId}` : '/timetable'}
          className="button-secondary"
        >
          Cancel
        </Link>
        <button className="button-primary" disabled={saving || !allDaysValid}>
          {saving ? 'Saving…' : editing ? 'Save timing changes' : 'Create timing profile'}
        </button>
      </div>
    </form>
  );
}
