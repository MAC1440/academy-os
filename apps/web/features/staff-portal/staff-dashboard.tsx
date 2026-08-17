'use client';

import Link from 'next/link';
import { BookOpen, CalendarDays, NotebookPen, Timer } from 'lucide-react';
import type { ApiRecord } from '@web/store/api/base-api';
import {
  useGetStaffPortalOverviewQuery,
  useListStaffAnnouncementsQuery,
  useListStaffNotesQuery,
} from './staff-portal.api';
import { StaffPinForm } from './staff-pin-form';

export function StaffDashboard() {
  const overview = useGetStaffPortalOverviewQuery();
  const announcements = useListStaffAnnouncementsQuery();
  const notes = useListStaffNotesQuery();
  if (overview.isLoading)
    return <p className="text-sm text-muted-foreground">Loading your workspace...</p>;
  if (overview.isError || !overview.data)
    return (
      <p className="text-sm text-destructive">
        Your staff workspace could not be loaded. Please contact an administrator.
      </p>
    );

  const staff = overview.data.staff as ApiRecord;
  const attendance = overview.data.attendance as ApiRecord | null;
  const assignments = Array.isArray(staff.academicOfferingAssignments)
    ? (staff.academicOfferingAssignments as ApiRecord[])
    : [];
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Staff workspace</p>
          <h1 className="mt-1 font-display text-4xl tracking-[-.04em]">
            Welcome, {String((staff.user as ApiRecord)?.fullName ?? 'teacher')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything needed for today’s teaching work, in one place.
          </p>
        </div>
        <Link href="/kiosk" className="button-primary">
          Open attendance kiosk
        </Link>
      </header>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
        <Metric
          label="Today's attendance"
          value={attendance ? String(attendance.status) : 'Not checked in'}
          icon={Timer}
        />
        <Metric label="Assigned classes" value={String(assignments.length)} icon={BookOpen} />
        <Metric label="Shared notes" value={String(notes.data?.length ?? 0)} icon={NotebookPen} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl">My classes</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Assignments are a quick reference; staff can still support every class when needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/timetable" className="button-secondary">
              My schedule
            </Link>
            <Link href="/attendance" className="button-secondary">
              Mark attendance
            </Link>
            <Link href="/syllabus" className="button-secondary">
              View syllabus
            </Link>
          </div>
        </div>
        {assignments.length ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Class / course</th>
                  <th className="pb-3 font-medium">Campus</th>
                  <th className="pb-3 font-medium">Section / group</th>
                  <th className="pb-3 font-medium">Subjects</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const offering = assignment.academicOffering as ApiRecord;
                  const title =
                    (offering.schoolClass as ApiRecord | undefined)?.name ??
                    (offering.course as ApiRecord | undefined)?.name ??
                    'Academic offering';
                  const subjects = Array.isArray(offering.subjects)
                    ? (offering.subjects as ApiRecord[])
                    : [];
                  return (
                    <tr
                      key={String(assignment.academicOfferingId)}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-3 font-semibold">{String(title)}</td>
                      <td className="py-3">
                        {String((offering.branch as ApiRecord | undefined)?.name ?? '—')}
                      </td>
                      <td className="py-3">
                        {[
                          offering.sectionName && `Section ${String(offering.sectionName)}`,
                          (offering.academicGroup as ApiRecord | undefined)?.name,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {subjects
                          .map((item) =>
                            String((item.subject as ApiRecord | undefined)?.name ?? ''),
                          )
                          .filter(Boolean)
                          .join(', ') || 'Not assigned'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            No specific class assignment has been added yet. You can still use attendance and shared
            notes to support the team.
          </p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Feed
          title="Staff announcements"
          icon={CalendarDays}
          empty="No announcements right now."
          items={announcements.data ?? []}
        />
        <Feed
          title="Shared notes"
          icon={NotebookPen}
          empty="No shared notes yet."
          items={notes.data ?? []}
          action={
            <Link
              href="/notes"
              className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300"
            >
              Open notes
            </Link>
          }
        />
      </div>
      <StaffPinForm />
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Timer;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <Icon size={18} className="text-teal-700 dark:text-teal-300" />
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
function Feed({
  title,
  icon: Icon,
  empty,
  items,
  action,
}: {
  title: string;
  icon: typeof Timer;
  empty: string;
  items: ApiRecord[];
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <Icon size={20} className="text-teal-700 dark:text-teal-300" />
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-4 grid gap-3">
        {items.slice(0, 5).map((item) => (
          <article key={String(item.id)} className="rounded-xl bg-muted/50 p-4">
            <p className="font-semibold">{String(item.title)}</p>
            <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {String(item.content)}
            </p>
            {item.eventDate ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {String(item.eventDate).slice(0, 10)}
              </p>
            ) : null}
          </article>
        ))}
        {!items.length ? <p className="text-sm text-muted-foreground">{empty}</p> : null}
      </div>
    </section>
  );
}
