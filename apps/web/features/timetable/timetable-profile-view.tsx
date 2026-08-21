'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { DataTable, TableEmpty } from '@web/components/data-table';
import { useGetTimetableProfileQuery } from './timetable.api';
import {
  formatDuration,
  slotDurationMinutes,
  slotsForDay,
  timetableDayLabel,
  timetableWeekdays,
} from './timetable-utils';

export function TimetableProfileView({ profileId }: { profileId: string }) {
  const { data: profile, isLoading, isError } = useGetTimetableProfileQuery(profileId || skipToken);
  const days = profile?.timetableMode === 'DAY_SPECIFIC' ? timetableWeekdays : [undefined];
  const [selectedDay, setSelectedDay] = useState<string>('');
  const activeDay = profile?.timetableMode === 'DAY_SPECIFIC' ? selectedDay || 'MONDAY' : undefined;
  const rows = useMemo(
    () => (profile ? slotsForDay(profile.slots, activeDay as never) : []),
    [activeDay, profile],
  );
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading timing profile…</p>;
  if (isError || !profile)
    return <p className="text-sm text-destructive">This timing profile could not be loaded.</p>;
  const scope =
    profile.scope === 'ORGANIZATION'
      ? 'Entire organization'
      : profile.scope === 'BRANCH'
        ? `Campus override · ${String(profile.branch?.name ?? '')}`
        : 'Class override';
  return (
    <div className="space-y-6">
      <Link
        href="/timetable"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> All timetables
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">{scope}</p>
          <h1 className="mt-2 font-display text-4xl tracking-[-.04em]">{profile.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile.timetableMode === 'SAME_DAILY'
              ? 'The same timeline applies Monday through Saturday.'
              : 'Each working day has its own timeline.'}{' '}
            · {profile.isActive ? 'Active' : 'Draft'}
          </p>
        </div>
        <Link
          href={`/timetable/profiles/${profile.id}/edit`}
          className="button-primary inline-flex items-center gap-2"
        >
          <Pencil size={16} /> Edit timings
        </Link>
      </header>
      {profile.timetableMode === 'DAY_SPECIFIC' ? (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {days.map((day) => (
            <button
              key={day}
              role="tab"
              aria-selected={activeDay === day}
              className={
                activeDay === day
                  ? 'button-primary whitespace-nowrap'
                  : 'button-secondary whitespace-nowrap'
              }
              onClick={() => setSelectedDay(String(day))}
            >
              {timetableDayLabel(day)}
            </button>
          ))}
        </div>
      ) : null}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl">{timetableDayLabel(activeDay as never)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {rows[0]?.startsAt ?? '—'} to {rows.at(-1)?.endsAt ?? '—'} ·{' '}
              {formatDuration(rows.reduce((total, row) => total + slotDurationMinutes(row), 0))}
            </p>
          </div>
          <span className="status-badge">
            {rows.filter((row) => row.slotType === 'TEACHING').length} teaching periods
          </span>
        </div>
        <DataTable minWidth="38rem">
          <thead className="bg-muted/45 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Entry</th>
              <th>Starts</th>
              <th>Ends</th>
              <th className="px-4">Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((slot) => (
              <tr
                key={slot.id ?? `${slot.startsAt}-${slot.slotType}`}
                className="border-t border-border/70"
              >
                <td className="px-4 py-3 font-semibold">
                  {slot.slotType === 'TEACHING'
                    ? `Period ${slot.periodNumber}`
                    : slot.slotType === 'ASSEMBLY'
                      ? 'Assembly'
                      : 'Break'}
                </td>
                <td>{slot.startsAt}</td>
                <td>{slot.endsAt}</td>
                <td className="px-4">{formatDuration(slotDurationMinutes(slot))}</td>
              </tr>
            ))}
            {!rows.length ? (
              <TableEmpty colSpan={4}>No entries are set for this day.</TableEmpty>
            ) : null}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}
