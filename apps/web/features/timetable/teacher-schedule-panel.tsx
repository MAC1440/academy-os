'use client';

import { useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { CalendarClock } from 'lucide-react';
import type { ApiRecord } from '@web/store/api/base-api';
import { useGetTeacherTimetableQuery } from './timetable.api';
import { formatDuration, offeringTitle, slotDurationMinutes } from './timetable-utils';

export function TeacherSchedulePanel({
  staffProfileId,
  teacherName,
}: {
  staffProfileId: string;
  teacherName: string;
}) {
  const {
    data = [],
    isLoading,
    isError,
  } = useGetTeacherTimetableQuery(staffProfileId || skipToken);
  const dates = useMemo(
    () => [...new Set(data.map((item) => String(item.date ?? '')))].filter(Boolean).sort(),
    [data],
  );
  const [activeDate, setActiveDate] = useState('');

  useEffect(() => {
    if (!dates.length) return;
    const today = todayKey();
    if (!activeDate || !dates.includes(activeDate)) {
      setActiveDate(dates.includes(today) ? today : dates[0]!);
    }
  }, [activeDate, dates]);

  const schedule = data.filter((item) => String(item.date) === activeDate);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading schedule…</p>;
  if (isError) {
    return (
      <p className="text-sm text-destructive">
        {teacherName}&apos;s schedule could not be loaded. Check their campus access and try again.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <CalendarClock aria-hidden="true" size={19} />
          </span>
          <div>
            <h3 className="font-semibold">{teacherName}&apos;s week</h3>
            <p className="text-sm text-muted-foreground">
              Teaching, free periods and school-day breaks.
            </p>
          </div>
        </div>
        {dates.length ? (
          <div
            className="flex max-w-full gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Schedule days"
          >
            {dates.map((date) => (
              <button
                key={date}
                type="button"
                role="tab"
                aria-selected={date === activeDate}
                className={
                  date === activeDate ? 'button-primary shrink-0' : 'button-secondary shrink-0'
                }
                onClick={() => setActiveDate(date)}
              >
                {scheduleDayLabel(date)}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Period</th>
              <th>Subject</th>
              <th>Class / section</th>
              <th>Campus</th>
              <th>Time</th>
              <th className="px-4">Duration</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item, index) => {
              const offering = item.offering as ApiRecord | undefined;
              const entryType = String(item.entryType ?? 'TEACHING');
              const isTeaching = entryType === 'TEACHING';
              return (
                <tr
                  key={`${item.date}-${item.startsAt}-${entryType}-${index}`}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="px-4 py-3">
                    {item.periodNumber ? String(item.periodNumber) : '—'}
                  </td>
                  <td>
                    {isTeaching
                      ? String((item.subject as ApiRecord)?.name ?? '—')
                      : entryType === 'FREE'
                        ? 'Free period'
                        : titleCase(entryType)}
                  </td>
                  <td>{isTeaching && offering ? offeringTitle(offering) : '—'}</td>
                  <td>{String((item.branch as ApiRecord | undefined)?.name ?? '—')}</td>
                  <td>
                    {String(item.startsAt)}–{String(item.endsAt)}
                  </td>
                  <td className="px-4">
                    {formatDuration(
                      slotDurationMinutes({
                        startsAt: String(item.startsAt),
                        endsAt: String(item.endsAt),
                      }),
                    )}
                  </td>
                </tr>
              );
            })}
            {!schedule.length ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No schedule is available for this day.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function todayKey() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts()
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function scheduleDayLabel(date: string) {
  return new Intl.DateTimeFormat('en-PK', {
    timeZone: 'Asia/Karachi',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T12:00:00Z`));
}

function titleCase(value: string) {
  return `${value[0] ?? ''}${value.slice(1).toLowerCase()}`;
}
