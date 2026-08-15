'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { CalendarClock, Plus } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { useAppSelector } from '@web/store/hooks';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import { useListOfferingsQuery, useListSubjectsQuery } from '@web/features/academics/academics.api';
import { useListStaffQuery } from '@web/features/staff/staff.api';
import type { ApiRecord } from '@web/store/api/base-api';
import {
  TimetableSlotInput,
  useCreateTimetableProfileMutation,
  useDeleteTimetableProfileMutation,
  useGetClassTimetableQuery,
  useGetMyTimetableQuery,
  useListTimetableProfilesQuery,
  useSaveTimetableAssignmentsMutation,
  useSetTimetableProfileActiveMutation,
  useUpdateTimetableProfileMutation,
} from './timetable.api';

const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const defaultSlots = (): TimetableSlotInput[] => {
  const slots: TimetableSlotInput[] = [
    { slotType: 'ASSEMBLY', startsAt: '07:30', endsAt: '07:40' },
  ];
  let cursor = 460;
  for (let period = 1; period <= 9; period += 1) {
    const start = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
    cursor += 40;
    const end = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`;
    slots.push({ slotType: 'TEACHING', periodNumber: period, startsAt: start, endsAt: end });
    if (period === 5) {
      const breakStart = end;
      cursor += 20;
      slots.push({
        slotType: 'BREAK',
        startsAt: breakStart,
        endsAt: `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`,
      });
    }
  }
  return slots;
};

export function TimetableManagement() {
  const user = useAppSelector((state) => state.auth.user);
  return user?.accountType === 'STAFF' ? <MySchedule /> : <AdminTimetable />;
}

function AdminTimetable() {
  const toast = useToast();
  const { data: branches = [] } = useListBranchesQuery();
  const [branchId, setBranchId] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [offeringId, setOfferingId] = useState('');
  const { data: profiles = [] } = useListTimetableProfilesQuery(branchId || skipToken);
  const [create] = useCreateTimetableProfileMutation();
  const [update] = useUpdateTimetableProfileMutation();
  const [setActive] = useSetTimetableProfileActiveMutation();
  const [remove] = useDeleteTimetableProfileMutation();
  const [form, setForm] = useState({
    name: 'Summer schedule',
    scope: 'BRANCH',
    academicOfferingId: '',
    timetableMode: 'SAME_DAILY',
    slots: defaultSlots() as TimetableSlotInput[],
  });
  const offerings = useListOfferingsQuery(branchId || skipToken).data ?? [];
  const timetable = useGetClassTimetableQuery(offeringId || skipToken);
  const { data: subjects = [] } = useListSubjectsQuery();
  const { data: staff = [] } = useListStaffQuery();
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const body = {
        ...form,
        academicOfferingId: form.scope === 'CLASS_OVERRIDE' ? form.academicOfferingId : undefined,
      };
      if (editingProfileId) await update({ profileId: editingProfileId, body }).unwrap();
      else await create({ branchId, body }).unwrap();
      setCreating(false);
      setEditingProfileId(null);
      toast.success(
        editingProfileId
          ? 'Timing profile updated.'
          : 'Timing profile created. Activate it when ready.',
      );
    } catch {
      toast.error('Check the slot times. Each day must run continuously without gaps or overlaps.');
    }
  }
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display text-4xl tracking-[-.04em]">Timetable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set branch timings, make class overrides, then assign teachers and subjects.
          </p>
        </div>
        <button
          className="button-primary inline-flex items-center gap-2"
          disabled={!branchId}
          onClick={() => {
            setEditingProfileId(null);
            setForm({
              name: 'Summer schedule',
              scope: 'BRANCH',
              academicOfferingId: '',
              timetableMode: 'SAME_DAILY',
              slots: defaultSlots(),
            });
            setCreating(true);
          }}
        >
          <Plus size={16} /> New timing profile
        </button>
      </header>
      <label className="grid max-w-md gap-2 text-sm font-medium">
        Campus
        <select
          className="field"
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setOfferingId('');
          }}
        >
          <option value="">Select a campus</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {String(branch.name)}
            </option>
          ))}
        </select>
      </label>
      {creating ? (
        <ProfileForm
          form={form}
          setForm={setForm}
          offerings={offerings as ApiRecord[]}
          onCancel={() => {
            setCreating(false);
            setEditingProfileId(null);
          }}
          onSubmit={submit}
        />
      ) : null}
      {branchId ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Profile</th>
                  <th>Scope</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th className="px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-4 font-semibold">{String(profile.name)}</td>
                    <td>
                      {String(profile.scope) === 'BRANCH' ? 'Branch default' : 'Class override'}
                    </td>
                    <td>{String(profile.timetableMode).replace('_', ' ')}</td>
                    <td>{profile.isActive ? 'Active' : 'Draft'}</td>
                    <td className="px-5 text-right">
                      <button
                        className="mr-3 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
                        onClick={() => {
                          setEditingProfileId(profile.id);
                          setForm({
                            name: String(profile.name),
                            scope: String(profile.scope),
                            academicOfferingId: String(profile.academicOfferingId ?? ''),
                            timetableMode: String(profile.timetableMode),
                            slots: Array.isArray(profile.slots)
                              ? (profile.slots as TimetableSlotInput[])
                              : defaultSlots(),
                          });
                          setCreating(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="mr-3 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
                        onClick={() => setActive({ profileId: profile.id, isActive: true })}
                      >
                        Activate
                      </button>
                      <button
                        className="text-sm font-semibold text-destructive hover:underline"
                        onClick={() => remove(profile.id)}
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
                {!profiles.length ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                      No timing profiles for this campus yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <div>
              <h2 className="font-display text-2xl">Class timetable</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign a subject and teacher to each teaching period. Breaks remain visible but
                cannot be assigned.
              </p>
            </div>
            <label className="grid max-w-md gap-2 text-sm font-medium">
              Class or section
              <select
                className="field"
                value={offeringId}
                onChange={(e) => setOfferingId(e.target.value)}
              >
                <option value="">Select class</option>
                {offerings.map((offering) => (
                  <option key={offering.id} value={offering.id}>
                    {offeringTitle(offering)}
                  </option>
                ))}
              </select>
            </label>
            {offeringId ? (
              <AssignmentEditor
                timetable={timetable.data}
                loading={timetable.isLoading}
                error={timetable.isError}
                offering={offerings.find((item) => item.id === offeringId)}
                subjects={subjects}
                staff={staff}
                branchId={branchId}
              />
            ) : null}
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Choose a campus to work with its timetable.</p>
      )}
    </div>
  );
}

function offeringTitle(offering: ApiRecord) {
  const title =
    (offering.schoolClass as ApiRecord | undefined)?.name ??
    (offering.course as ApiRecord | undefined)?.name ??
    'Class';
  return `${String(title)}${offering.sectionName ? ` · Section ${String(offering.sectionName)}` : ''}`;
}

function AssignmentEditor({
  timetable,
  loading,
  error,
  offering,
  subjects,
  staff,
  branchId,
}: {
  timetable?: ApiRecord;
  loading: boolean;
  error: boolean;
  offering?: ApiRecord;
  subjects: ApiRecord[];
  staff: ApiRecord[];
  branchId: string;
}) {
  const toast = useToast();
  const [save, { isLoading }] = useSaveTimetableAssignmentsMutation();
  const rows = Array.isArray(timetable?.rows) ? (timetable.rows as ApiRecord[]) : [];
  const [draft, setDraft] = useState<Record<string, { subjectId: string; staffProfileId: string }>>(
    {},
  );
  const [conflicts, setConflicts] = useState<ApiRecord[]>([]);
  useEffect(() => {
    setDraft(
      Object.fromEntries(
        rows
          .filter((row) => row.slotType === 'TEACHING')
          .map((row) => [
            row.id,
            {
              subjectId: String((row.assignment as ApiRecord | null)?.subjectId ?? ''),
              staffProfileId: String((row.assignment as ApiRecord | null)?.staffProfileId ?? ''),
            },
          ]),
      ),
    );
  }, [timetable]);
  if (loading)
    return <p className="text-sm text-muted-foreground">Loading effective timing profile...</p>;
  if (error || !timetable || !offering)
    return (
      <p className="text-sm text-destructive">
        Activate a branch profile or class override before assigning periods.
      </p>
    );
  const selectedOffering = offering;
  const profileId = String((timetable.profile as ApiRecord).id);
  const allowedSubjectIds = new Set(
    ((selectedOffering.subjects as ApiRecord[] | undefined) ?? []).map((item) =>
      String(item.subjectId),
    ),
  );
  const availableTeachers = staff.filter((person) => {
    if (person.staffType !== 'TEACHER') return false;
    const roleAssignments =
      ((person.user as ApiRecord | undefined)?.roleAssignments as ApiRecord[] | undefined) ?? [];
    return roleAssignments.some((assignment) => String(assignment.branchId) === branchId);
  });
  const subjectsAvailableForSlot = (slotId: string) => {
    const selectedInOtherPeriods = new Set(
      Object.entries(draft)
        .filter(([otherSlotId, value]) => otherSlotId !== slotId && value.subjectId)
        .map(([, value]) => value.subjectId),
    );
    return subjects
      .filter((subject) => allowedSubjectIds.has(String(subject.id)))
      .filter((subject) => !selectedInOtherPeriods.has(String(subject.id)));
  };
  const change = (slotId: string, key: 'subjectId' | 'staffProfileId', value: string) =>
    setDraft({
      ...draft,
      [slotId]: { ...(draft[slotId] ?? { subjectId: '', staffProfileId: '' }), [key]: value },
    });
  async function submit(replaceTeacherConflicts = false) {
    const assignments = Object.entries(draft)
      .filter(([, value]) => value.subjectId && value.staffProfileId)
      .map(([timetableSlotId, value]) => ({ timetableSlotId, ...value }));
    try {
      await save({
        offeringId: selectedOffering.id,
        profileId,
        assignments,
        replaceTeacherConflicts,
      }).unwrap();
      setConflicts([]);
      toast.success('Class timetable saved.');
    } catch (error) {
      const payload = (
        error as { data?: { conflicts?: ApiRecord[]; message?: { conflicts?: ApiRecord[] } } }
      ).data;
      const detectedConflicts = payload?.conflicts ?? payload?.message?.conflicts ?? [];
      if (detectedConflicts.length) {
        setConflicts(detectedConflicts);
        return;
      }
      toast.error(
        'The timetable could not be saved. Check teacher conflicts and class assignments.',
      );
    }
  }
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th>Subject</th>
              <th>Teacher</th>
              <th className="px-4">Start–end</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
              row.slotType === 'TEACHING' ? (
                <tr key={row.id} className="border-b border-border/70">
                  <td className="px-4 py-3 font-semibold">{String(row.periodNumber)}</td>
                  <td>
                    <select
                      className="field my-1 min-w-48"
                      value={draft[row.id]?.subjectId ?? ''}
                      onChange={(e) => change(row.id, 'subjectId', e.target.value)}
                    >
                      <option value="">Free period</option>
                      {subjectsAvailableForSlot(row.id).map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {String(subject.name)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="field my-1 min-w-52"
                      value={draft[row.id]?.staffProfileId ?? ''}
                      onChange={(e) => change(row.id, 'staffProfileId', e.target.value)}
                    >
                      <option value="">Choose teacher</option>
                      {availableTeachers.map((person) => (
                        <option key={person.id} value={person.id}>
                          {String((person.user as ApiRecord)?.fullName ?? 'Teacher')}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4">
                    {String(row.startsAt)}–{String(row.endsAt)}
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className="border-b border-border/70 bg-muted/25">
                  <td className="px-4 py-3 font-medium" colSpan={3}>
                    {String(row.slotType).toLowerCase()}
                  </td>
                  <td className="px-4">
                    {String(row.startsAt)}–{String(row.endsAt)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        <button className="button-primary mt-4" disabled={isLoading} onClick={() => submit()}>
          {isLoading ? 'Saving…' : 'Save timetable'}
        </button>
      </div>
      {conflicts.length ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-conflict-title"
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl"
          >
            <h3 id="teacher-conflict-title" className="font-display text-2xl">
              Replace an existing teaching period?
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This teacher is already scheduled below. Confirming will clear that existing class
              period and assign the teacher to the timetable you are saving.
            </p>
            <ul className="mt-4 space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
              {conflicts.map((conflict) => (
                <li key={String(conflict.assignmentId)}>
                  <strong>{String(conflict.teacherName)}</strong> — {String(conflict.className)},
                  period {String(conflict.periodNumber ?? '—')} (
                  {String(conflict.weekday).toLowerCase()}, {String(conflict.startsAt)}–
                  {String(conflict.endsAt)})
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="button-secondary" onClick={() => setConflicts([])}>
                Keep existing timetable
              </button>
              <button type="button" className="button-primary" onClick={() => submit(true)}>
                Replace and save
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ProfileForm({
  form,
  setForm,
  offerings,
  onSubmit,
  onCancel,
}: {
  form: any;
  setForm: any;
  offerings: ApiRecord[];
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
}) {
  const days = form.timetableMode === 'DAY_SPECIFIC' ? weekdays : [undefined];
  const slots = useMemo(() => form.slots as TimetableSlotInput[], [form.slots]);
  const slotsForDay = (day?: string) =>
    slots.filter((slot) => (day ? slot.weekday === day : !slot.weekday));
  const minute = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
  const time = (value: number) =>
    `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  const normalize = (daySlots: TimetableSlotInput[]) => {
    let cursor = minute(daySlots[0]?.startsAt ?? '07:30');
    let period = 0;
    return daySlots.map((slot) => {
      const duration = Math.max(1, minute(slot.endsAt) - minute(slot.startsAt));
      const next = {
        ...slot,
        startsAt: time(cursor),
        endsAt: time(cursor + duration),
        periodNumber: slot.slotType === 'TEACHING' ? ++period : undefined,
      };
      cursor += duration;
      return next;
    });
  };
  const updateDay = (day: string | undefined, next: TimetableSlotInput[]) =>
    setForm({
      ...form,
      slots: slots
        .flatMap((slot) => ((day ? slot.weekday === day : !slot.weekday) ? [] : [slot]))
        .concat(
          next.map((slot) => ({
            ...slot,
            ...(day ? { weekday: day as TimetableSlotInput['weekday'] } : { weekday: undefined }),
          })),
        ),
    });
  const moveBreak = (day: string | undefined, index: number, direction: -1 | 1) => {
    const next = slotsForDay(day);
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const current = next[index]!;
    next[index] = next[target]!;
    next[target] = current;
    updateDay(day, normalize(next));
  };
  const addBreak = (day: string | undefined, index: number) => {
    const next = slotsForDay(day);
    const after = next[index];
    if (!after) return;
    next.splice(index + 1, 0, {
      slotType: 'BREAK',
      startsAt: after.endsAt,
      endsAt: time(minute(after.endsAt) + 20),
    });
    updateDay(day, normalize(next));
  };
  const removeBreak = (day: string | undefined, index: number) => {
    const next = slotsForDay(day);
    next.splice(index, 1);
    updateDay(day, normalize(next));
  };
  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          Profile name
          <input
            className="field"
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Applies to
          <select
            className="field"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
          >
            <option value="BRANCH">All classes in this campus</option>
            <option value="CLASS_OVERRIDE">One class / section</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Pattern
          <select
            className="field"
            value={form.timetableMode}
            onChange={(e) => {
              const mode = e.target.value;
              const base = slots.filter((slot) => !slot.weekday);
              setForm({
                ...form,
                timetableMode: mode,
                slots:
                  mode === 'DAY_SPECIFIC'
                    ? weekdays.flatMap((day) => base.map((slot) => ({ ...slot, weekday: day })))
                    : slotsForDay('MONDAY').map((slot) => ({ ...slot, weekday: undefined })),
              });
            }}
          >
            <option value="SAME_DAILY">Same Monday–Saturday</option>
            <option value="DAY_SPECIFIC">Different by weekday</option>
          </select>
        </label>
      </div>
      {form.scope === 'CLASS_OVERRIDE' ? (
        <label className="grid max-w-md gap-2 text-sm font-medium">
          Class or section
          <select
            required
            className="field"
            value={form.academicOfferingId}
            onChange={(e) => setForm({ ...form, academicOfferingId: e.target.value })}
          >
            <option value="">Select class</option>
            {offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {offeringTitle(offering)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Move any break between periods, add more breaks after a period, or remove every break for a
        continuous day. Times after the change are recalculated automatically.
      </p>
      {days.map((day) => {
        const daySlots = slotsForDay(day);
        return (
          <section key={day ?? 'daily'} className="overflow-x-auto rounded-xl border border-border">
            <h2 className="border-b border-border px-4 py-3 font-semibold">
              {day ? day[0] + day.slice(1).toLowerCase() : 'Daily timeline'}
            </h2>
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Type</th>
                  <th>Period</th>
                  <th>Starts</th>
                  <th>Ends</th>
                  <th className="px-4 text-right">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {daySlots.map((slot, index) => (
                  <tr key={`${slot.slotType}-${index}`} className="border-t border-border/70">
                    <td className="px-4 py-2">{slot.slotType}</td>
                    <td>{slot.periodNumber ?? '—'}</td>
                    <td>
                      <input
                        className="field my-1 w-28"
                        type="time"
                        value={slot.startsAt}
                        onChange={(e) => {
                          const next = [...daySlots];
                          next[index] = { ...slot, startsAt: e.target.value };
                          updateDay(day, next);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="field my-1 w-28"
                        type="time"
                        value={slot.endsAt}
                        onChange={(e) => {
                          const next = [...daySlots];
                          next[index] = { ...slot, endsAt: e.target.value };
                          updateDay(day, next);
                        }}
                      />
                    </td>
                    <td className="px-4 text-right">
                      {slot.slotType === 'BREAK' ? (
                        <>
                          <button
                            type="button"
                            className="mr-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
                            onClick={() => moveBreak(day, index, -1)}
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            className="mr-2 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
                            onClick={() => moveBreak(day, index, 1)}
                          >
                            Move down
                          </button>
                          <button
                            type="button"
                            className="text-sm font-semibold text-destructive hover:underline"
                            onClick={() => removeBreak(day, index)}
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
                          onClick={() => addBreak(day, index)}
                        >
                          Add break after
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
      <div className="flex gap-2">
        <button className="button-primary">Save timing profile</button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function MySchedule() {
  const { data = [], isLoading, isError } = useGetMyTimetableQuery();
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading your schedule...</p>;
  if (isError)
    return <p className="text-sm text-destructive">Your schedule could not be loaded.</p>;
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-background px-5 py-8">
      <header className="mb-6">
        <CalendarClock className="text-teal-600" />
        <h1 className="mt-3 font-display text-4xl tracking-[-.04em]">My schedule</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Teaching periods from every campus are shown together.
        </p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Day</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Class / section</th>
              <th>Campus</th>
              <th className="px-5">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const offering = item.offering as ApiRecord | undefined;
              const entryType = String(item.entryType ?? 'TEACHING');
              const isTeaching = entryType === 'TEACHING';
              return (
                <tr
                  key={`${item.weekday}-${item.periodNumber}-${item.startsAt}-${entryType}`}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-5 py-3">{String(item.weekday).toLowerCase()}</td>
                  <td>{item.periodNumber ? String(item.periodNumber) : '—'}</td>
                  <td>
                    {isTeaching
                      ? String((item.subject as ApiRecord).name)
                      : entryType === 'FREE'
                        ? 'Free period'
                        : entryType.toLowerCase()}
                  </td>
                  <td>
                    {isTeaching && offering ? (
                      <>
                        {String(
                          (offering.schoolClass as ApiRecord | undefined)?.name ??
                            (offering.course as ApiRecord | undefined)?.name ??
                            'Class',
                        )}
                        {offering.sectionName ? ` · ${String(offering.sectionName)}` : ''}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{String((item.branch as ApiRecord).name)}</td>
                  <td className="px-5">
                    {String(item.startsAt)}–{String(item.endsAt)}
                  </td>
                </tr>
              );
            })}
            {!data.length ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  No teaching periods have been assigned to you yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  );
}
