'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { ArrowLeft, Pencil } from 'lucide-react';
import { DataTable, TableEmpty } from '@web/components/data-table';
import { useListStaffQuery } from '@web/features/staff/staff.api';
import { useListSubjectsQuery } from '@web/features/academics/academics.api';
import type { ApiRecord } from '@web/store/api/base-api';
import { AssignmentEditor, DailyCoverageManager } from './timetable-management';
import { useGetClassTimetableQuery } from './timetable.api';
import {
  formatDuration,
  offeringTitle,
  slotDurationMinutes,
  timetableDayLabel,
  timetableWeekdays,
} from './timetable-utils';

export function ClassTimetableScreen({
  offeringId,
  editing = false,
}: {
  offeringId: string;
  editing?: boolean;
}) {
  const timetable = useGetClassTimetableQuery(offeringId || skipToken);
  const { data: subjects = [] } = useListSubjectsQuery();
  const { data: staff = [] } = useListStaffQuery();
  const offering = timetable.data?.offering;
  const profile = timetable.data?.profile;
  const [selectedDay, setSelectedDay] = useState('MONDAY');
  const rows = useMemo(() => {
    const all = timetable.data?.rows ?? [];
    return all.filter(
      (row) => profile?.timetableMode === 'SAME_DAILY' || row.weekday === selectedDay,
    );
  }, [profile?.timetableMode, selectedDay, timetable.data?.rows]);
  if (timetable.isLoading)
    return <p className="text-sm text-muted-foreground">Loading class timetable…</p>;
  if (timetable.isError || !offering || !profile)
    return (
      <p className="text-sm text-destructive">
        Activate an organization, campus or class timing profile before opening this timetable.
      </p>
    );
  const branchId = String(offering.branchId);
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
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">
            Class timetable
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-[-.04em]">
            {offeringTitle(offering)}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Using “{profile.name}” ·{' '}
            {String((offering.branch as ApiRecord | undefined)?.name ?? '')}
          </p>
        </div>
        {!editing ? (
          <Link
            href={`/timetable/classes/${offeringId}/edit`}
            className="button-primary inline-flex items-center gap-2"
          >
            <Pencil size={16} /> Assign periods
          </Link>
        ) : null}
      </header>
      {profile.timetableMode === 'DAY_SPECIFIC' ? (
        <div className="flex gap-2 overflow-x-auto">
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
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {editing ? (
          <>
            <AssignmentEditor
              timetable={timetable.data as unknown as ApiRecord}
              loading={timetable.isLoading}
              error={timetable.isError}
              offering={offering}
              subjects={subjects}
              staff={staff}
              branchId={branchId}
              weekday={profile.timetableMode === 'DAY_SPECIFIC' ? selectedDay : undefined}
            />
            <DailyCoverageManager
              branchId={branchId}
              timetable={timetable.data as unknown as ApiRecord}
              staff={staff}
            />
          </>
        ) : (
          <DataTable minWidth="48rem">
            <thead className="bg-muted/45 text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Period</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Time</th>
                <th className="px-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const assignment = row.assignment as ApiRecord | null | undefined;
                return (
                  <tr key={row.id} className="border-t border-border/70">
                    <td className="px-4 py-3 font-semibold">
                      {row.slotType === 'TEACHING'
                        ? `Period ${row.periodNumber}`
                        : row.slotType === 'ASSEMBLY'
                          ? 'Assembly'
                          : 'Break'}
                    </td>
                    <td>
                      {assignment
                        ? String((assignment.subject as ApiRecord)?.name ?? '—')
                        : row.slotType === 'TEACHING'
                          ? 'Free period'
                          : '—'}
                    </td>
                    <td>
                      {assignment
                        ? String(
                            ((assignment.staffProfile as ApiRecord)?.user as ApiRecord)?.fullName ??
                              '—',
                          )
                        : '—'}
                    </td>
                    <td>
                      {row.startsAt}–{row.endsAt}
                    </td>
                    <td className="px-4">{formatDuration(slotDurationMinutes(row))}</td>
                  </tr>
                );
              })}
              {!rows.length ? <TableEmpty colSpan={5}>No entries for this day.</TableEmpty> : null}
            </tbody>
          </DataTable>
        )}
      </section>
    </div>
  );
}
