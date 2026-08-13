'use client';

import { useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { BookOpen, CalendarDays, CircleDollarSign, TriangleAlert } from 'lucide-react';
import {
  useListLinkedStudentsQuery,
  useGetLinkedStudentAttendanceQuery,
  useGetLinkedStudentFinanceQuery,
  useGetLinkedStudentPerformanceQuery,
  useListLearnerAnnouncementsQuery,
  useListLearnerNotesQuery,
} from './learner-portal.api';
import type { ApiRecord } from '@web/store/api/base-api';

export function LearnerDashboard() {
  const { data: students = [], isLoading } = useListLinkedStudentsQuery();
  const [studentId, setStudentId] = useState('');
  const activeId = studentId || students[0]?.id || '';
  const student = students.find((item) => item.id === activeId);
  const performance = useGetLinkedStudentPerformanceQuery(activeId || skipToken);
  const finance = useGetLinkedStudentFinanceQuery(activeId || skipToken);
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const attendance = useGetLinkedStudentAttendanceQuery(
    activeId
      ? {
          studentId: activeId,
          from: from.toISOString().slice(0, 10),
          to: new Date().toISOString().slice(0, 10),
        }
      : skipToken,
  );
  const announcements = useListLearnerAnnouncementsQuery();
  const notes = useListLearnerNotesQuery();
  const marks = performance.data ?? [];
  const average = marks.length
    ? marks.reduce((total, mark) => total + Number(mark.percentage ?? 0), 0) / marks.length
    : 0;
  const subjectAverages = useMemo(
    () =>
      Object.values(
        marks.reduce<Record<string, { name: string; total: number; count: number }>>(
          (result, mark) => {
            const subject = (mark.subject as ApiRecord | undefined)?.name ?? 'Subject';
            const key = String(subject);
            result[key] ??= { name: key, total: 0, count: 0 };
            result[key].total += Number(mark.percentage ?? 0);
            result[key].count += 1;
            return result;
          },
          {},
        ),
      )
        .map((item) => ({ ...item, average: item.total / item.count }))
        .filter((item) => item.average < 50),
    [marks],
  );
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading your students...</p>;
  if (!students.length)
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-3xl">No students are linked yet.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please contact the academy office to link an admission to this guardian account.
        </p>
      </section>
    );
  const offering = student?.academicOffering as ApiRecord | undefined;
  const title = String(
    (offering?.schoolClass as ApiRecord | undefined)?.name ??
      (offering?.course as ApiRecord | undefined)?.name ??
      'Academic offering',
  );
  const subjects = Array.isArray(offering?.subjects) ? (offering?.subjects as ApiRecord[]) : [];
  const campus = String(
    (student?.branch as ApiRecord | undefined)?.name ??
      (offering?.branch as ApiRecord | undefined)?.name ??
      '',
  );
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl tracking-[-.04em]">Student portal</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Follow academic progress, attendance, and fee information for every linked student.
        </p>
      </header>
      <div role="tablist" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
        {students.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeId === item.id}
            onClick={() => setStudentId(item.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${activeId === item.id ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
          >
            {String(item.studentFullName)}
          </button>
        ))}
      </div>
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="Student" value={String(student?.studentFullName)} />
        <Info
          label="Class / course"
          value={`${title}${offering?.sectionName ? ` · Section ${String(offering.sectionName)}` : ''}`}
        />
        <Info label="Campus" value={campus} />
        <Info
          label="Academic term"
          value={String((student?.academicTerm as ApiRecord | undefined)?.name ?? '')}
        />
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">Academic progress</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info
              label="Average score"
              value={marks.length ? `${average.toFixed(1)}%` : 'No marks yet'}
            />
            <Info label="Recent assessments" value={String(marks.length)} />
          </div>
          {subjectAverages.length ? (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="flex items-center gap-2 font-semibold">
                <TriangleAlert size={16} /> Extra attention recommended
              </div>
              <p className="mt-1">
                {subjectAverages
                  .map((item) => `${item.name} (${item.average.toFixed(0)}%)`)
                  .join(', ')}
              </p>
            </div>
          ) : null}
          <div className="mt-4">
            <h3 className="font-semibold">Subjects</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {subjects.length
                ? subjects
                    .map((item) => String((item.subject as ApiRecord | undefined)?.name ?? ''))
                    .filter(Boolean)
                    .join(', ')
                : 'Subjects have not been published yet.'}
            </p>
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">Fees</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info
              label="Monthly fee"
              value={money((finance.data?.student as ApiRecord | undefined)?.monthlyFeeAmount)}
            />
            <Info label="Outstanding balance" value={money(finance.data?.balance)} />
            <Info
              label="Due date"
              value={String(
                (finance.data?.student as ApiRecord | undefined)?.balanceDueOn ?? 'Not set',
              ).slice(0, 10)}
            />
            <Info label="Total received" value={money(finance.data?.paid)} />
          </div>
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">Announcements & events</h2>
          <div className="mt-4 grid gap-3">
            {(announcements.data ?? []).slice(0, 5).map((announcement) => (
              <article key={announcement.id} className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold">{String(announcement.title)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{String(announcement.content)}</p>
                {announcement.eventDate ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {String(announcement.eventDate).slice(0, 10)}
                  </p>
                ) : null}
              </article>
            ))}
            {!announcements.data?.length ? (
              <p className="text-sm text-muted-foreground">No announcements right now.</p>
            ) : null}
          </div>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">Shared study notes</h2>
          <div className="mt-4 grid gap-3">
            {(notes.data ?? []).slice(0, 5).map((note) => (
              <article key={note.id} className="rounded-lg bg-muted/50 p-3">
                <p className="font-semibold">{String(note.title)}</p>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {String(note.content)}
                </p>
              </article>
            ))}
            {!notes.data?.length ? (
              <p className="text-sm text-muted-foreground">No shared notes yet.</p>
            ) : null}
          </div>
        </section>
      </div>
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl">Recent attendance</h2>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(attendance.data ?? []).slice(0, 30).map((entry) => (
            <span key={entry.id} className="rounded-lg border border-border px-3 py-2 text-sm">
              <strong>{String(entry.attendanceDate).slice(8, 10)}</strong> · {String(entry.status)}
            </span>
          ))}
          {!attendance.data?.length ? (
            <p className="text-sm text-muted-foreground">
              No attendance has been marked in this period.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value || 'Not available'}</p>
    </div>
  );
}
function money(value: unknown) {
  return `PKR ${Number(value ?? 0).toLocaleString('en-PK')}`;
}
