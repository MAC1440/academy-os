'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { CalendarCheck2, Clock3, Download, UsersRound } from 'lucide-react';
import {
  DataTable,
  DataTableControls,
  DataTablePagination,
  TableEmpty,
} from '@web/components/data-table';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useToast } from '@web/components/toast-provider';
import { useAppSelector } from '@web/store/hooks';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import {
  useGetKioskSettingsQuery,
  useOverrideStaffAttendanceMutation,
  useUpdateKioskSettingsMutation,
} from '@web/features/kiosk/kiosk.api';
import {
  useGetStaffAttendanceReportQuery,
  useLazyGetStaffAttendanceCsvQuery,
  useLazyGetStudentAttendanceCsvQuery,
} from '@web/features/reports/reports.api';
import {
  useGetStudentAttendanceRosterQuery,
  useLazyGetStudentAttendanceRosterQuery,
  useSaveStudentAttendanceMutation,
} from '../attendance.api';
import type { ApiRecord } from '@web/store/api/base-api';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
type RosterStudent = ApiRecord & { status?: AttendanceStatus | null };
const tabs = [
  { id: 'students', label: 'Student attendance', icon: UsersRound },
  { id: 'staff', label: 'Staff reports', icon: CalendarCheck2 },
  { id: 'kiosk', label: 'Kiosk settings', icon: Clock3 },
] as const;
const today = new Date().toISOString().slice(0, 10);

export function AttendanceManagement() {
  const user = useAppSelector((state) => state.auth.user);
  const isTeacher = user?.accountType === 'STAFF';
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('students');
  const visibleTabs = isTeacher ? tabs.filter((tab) => tab.id === 'students') : tabs;
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl tracking-[-.04em]">Attendance</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isTeacher
            ? 'Mark student attendance directly from the class roster.'
            : 'Mark student attendance directly from the class roster, review staff check-ins by campus, and configure the default kiosk workday.'}
        </p>
      </header>
      <div
        role="tablist"
        aria-label="Attendance operations"
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
      >
        {visibleTabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              id={`${id}-tab`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`${id}-panel`}
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${active ? 'bg-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
      {activeTab === 'students' ? <WeeklyStudentAttendance /> : null}
      {activeTab === 'staff' ? <StaffAttendanceReports /> : null}
      {activeTab === 'kiosk' ? <KioskSettings /> : null}
    </div>
  );
}

function weekContaining(date: string) {
  const value = new Date(`${date}T00:00:00`);
  const offset = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() - offset);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(value);
    day.setDate(value.getDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

function monthContaining(date: string) {
  const value = new Date(`${date}T00:00:00`);
  const from = new Date(value.getFullYear(), value.getMonth(), 1);
  const to = new Date(value.getFullYear(), value.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function datesBetween(from: string, to: string) {
  const dates: string[] = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function WeeklyStudentAttendance() {
  const { data: branches = [] } = useListBranchesQuery();
  const [branchId, setBranchId] = useState('');
  const [offeringId, setOfferingId] = useState('');
  const [anchorDate, setAnchorDate] = useState(today);
  const [view, setView] = useState<'week' | 'month'>('week');
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  const [loadRoster] = useLazyGetStudentAttendanceRosterQuery();
  const [save, { isLoading: saving }] = useSaveStudentAttendanceMutation();
  const [downloadCsv, { isFetching: downloading }] = useLazyGetStudentAttendanceCsvQuery();
  const toast = useToast();
  const weekDates = useMemo(() => weekContaining(anchorDate), [anchorDate]);
  const monthDates = useMemo(() => monthContaining(anchorDate), [anchorDate]);
  const displayDates = useMemo(
    () => (view === 'week' ? weekDates : datesBetween(monthDates.from, monthDates.to)),
    [monthDates, view, weekDates],
  );
  const [rosters, setRosters] = useState<Record<string, ApiRecord[]>>({});
  const [statuses, setStatuses] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSort, setStudentSort] = useState('name-asc');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(10);

  useEffect(() => {
    setOfferingId('');
  }, [branchId]);
  useEffect(() => {
    if (!offeringId) {
      setRosters({});
      setStatuses({});
      return;
    }
    let active = true;
    Promise.all(
      displayDates.map(
        async (date) => [date, await loadRoster({ offeringId, date }).unwrap()] as const,
      ),
    )
      .then((entries) => {
        if (!active) return;
        const nextRosters = Object.fromEntries(entries);
        setRosters(nextRosters);
        setStatuses(
          Object.fromEntries(
            entries.map(([date, roster]) => [
              date,
              Object.fromEntries(
                roster
                  .filter((student) => student.status)
                  .map((student) => [student.id, student.status as AttendanceStatus]),
              ),
            ]),
          ),
        );
      })
      .catch(() => {
        if (active) toast.error('Weekly attendance could not be loaded.');
      });
    return () => {
      active = false;
    };
  }, [displayDates, loadRoster, offeringId, toast]);

  const students: ApiRecord[] = rosters[displayDates[0] ?? ''] ?? [];
  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLocaleLowerCase();
    const sorted = [...students]
      .filter((student) => {
        if (!search) return true;
        return [student.fullName, student.registrationNumber]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase().includes(search));
      })
      .sort((left, right) => {
        const leftValue =
          studentSort === 'registration'
            ? String(left.registrationNumber ?? '')
            : String(left.fullName ?? '');
        const rightValue =
          studentSort === 'registration'
            ? String(right.registrationNumber ?? '')
            : String(right.fullName ?? '');
        const comparison = leftValue.localeCompare(rightValue, 'en');
        return studentSort === 'name-desc' ? -comparison : comparison;
      });
    return sorted;
  }, [studentSearch, studentSort, students]);
  const studentPageCount = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * studentPageSize,
    studentPage * studentPageSize,
  );

  useEffect(() => {
    setStudentPage(1);
  }, [anchorDate, offeringId, studentPageSize, studentSearch, studentSort, view]);
  useEffect(() => {
    if (studentPage > studentPageCount) setStudentPage(studentPageCount);
  }, [studentPage, studentPageCount]);

  function cycleMark(date: string, studentId: string) {
    const sequence: Array<AttendanceStatus | undefined> = [
      undefined,
      'PRESENT',
      'LATE',
      'LEAVE',
      'ABSENT',
    ];
    setStatuses((current) => {
      const currentStatus = current[date]?.[studentId];
      const nextStatus = sequence[(sequence.indexOf(currentStatus) + 1) % sequence.length];
      const nextDate = { ...(current[date] ?? {}) };
      if (nextStatus) nextDate[studentId] = nextStatus;
      else delete nextDate[studentId];
      return { ...current, [date]: nextDate };
    });
  }
  async function saveWeek() {
    const markedDays = displayDates
      .map((attendanceDate) => ({
        attendanceDate,
        records: Object.entries(statuses[attendanceDate] ?? {}).map(([studentId, status]) => ({
          studentId,
          status,
        })),
      }))
      .filter(({ records }) => records.length > 0);

    if (markedDays.length === 0) {
      toast.error('Mark at least one student before saving.');
      return;
    }

    try {
      await Promise.all(
        markedDays.map(({ attendanceDate, records }) =>
          save({
            offeringId,
            attendanceDate,
            records,
          }).unwrap(),
        ),
      );
      toast.success(
        `${view === 'week' ? 'Weekly' : 'Monthly'} attendance saved. Unmarked students remain unmarked.`,
      );
    } catch {
      toast.error(`${view === 'week' ? 'Weekly' : 'Monthly'} attendance could not be saved.`);
    }
  }
  async function downloadReport() {
    if (!offeringId) return;
    const range =
      view === 'week'
        ? {
            from: displayDates[0] ?? anchorDate,
            to: displayDates[displayDates.length - 1] ?? anchorDate,
          }
        : monthDates;
    try {
      const csv = await downloadCsv({ academicOfferingId: offeringId, ...range }).unwrap();
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `student-attendance-${range.from}-to-${range.to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Attendance report could not be downloaded.');
    }
  }
  return (
    <section
      role="tabpanel"
      id="students-panel"
      aria-labelledby="students-tab"
      className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Campus
          <select
            className="field"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">Select a campus</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {String(branch.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Class or course
          <select
            className="field"
            disabled={!branchId}
            value={offeringId}
            onChange={(event) => setOfferingId(event.target.value)}
          >
            <option value="">Select a class or course</option>
            {offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {String(
                  (offering.schoolClass as ApiRecord | undefined)?.name ??
                    (offering.course as ApiRecord | undefined)?.name ??
                    offering.id,
                )}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          {view === 'week' ? 'Week containing' : 'Month containing'}
          <input
            className="field"
            type="date"
            value={anchorDate}
            onChange={(event) => setAnchorDate(event.target.value)}
          />
        </label>
      </div>
      {offeringId ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="inline-flex rounded-lg bg-muted p-1" aria-label="Attendance view">
            {(['week', 'month'] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={view === item}
                onClick={() => setView(item)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${view === item ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {item === 'week' ? 'Weekly marking' : 'Monthly report'}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="button-secondary inline-flex items-center gap-2"
            disabled={downloading}
            onClick={downloadReport}
          >
            <Download size={16} />
            {downloading ? 'Preparing...' : 'Export CSV'}
          </button>
        </div>
      ) : null}
      {offeringId ? (
        <>
          <>
            <div className="rounded-xl bg-teal-50 p-3 text-sm text-teal-950">
              Click a day repeatedly to cycle: Present, Late, Leave, Absent, then Unmarked.
            </div>
            <DataTableControls
              searchValue={studentSearch}
              onSearchChange={setStudentSearch}
              searchPlaceholder="Search by student or registration number"
              sortValue={studentSort}
              onSortChange={setStudentSort}
              sortOptions={[
                { value: 'name-asc', label: 'Name: A to Z' },
                { value: 'name-desc', label: 'Name: Z to A' },
                { value: 'registration', label: 'Registration number' },
              ]}
            />
            <DataTable minWidth={view === 'week' ? '52rem' : '112rem'}>
              <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Student</th>
                  {displayDates.map((date) => (
                    <th key={date} className="px-3 py-3 text-center font-semibold">
                      {new Intl.DateTimeFormat('en-PK', {
                        weekday: 'short',
                        day: 'numeric',
                      }).format(new Date(`${date}T00:00:00`))}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.length === 0 ? (
                  <TableEmpty colSpan={displayDates.length + 1}>
                    {students.length === 0
                      ? 'No enrolled students in this class or course.'
                      : 'No students match your search.'}
                  </TableEmpty>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{String(student.fullName)}</p>
                        <p className="text-xs text-muted-foreground">
                          {String(student.registrationNumber ?? '')}
                        </p>
                      </td>
                      {displayDates.map((date) => {
                        const status = statuses[date]?.[student.id];
                        return (
                          <td key={date} className="px-2 py-3 text-center">
                            <button
                              type="button"
                              aria-label={`Change attendance for ${String(student.fullName)} on ${date}`}
                              onClick={() => cycleMark(date, student.id)}
                              className={`min-w-10 rounded-md px-2 py-1.5 text-xs font-semibold transition ${status === 'PRESENT' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : status === 'LATE' ? 'bg-amber-500 text-amber-950 hover:bg-amber-600' : status === 'LEAVE' ? 'bg-sky-600 text-white hover:bg-sky-700' : status === 'ABSENT' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-muted text-muted-foreground hover:bg-teal-50'}`}
                            >
                              {status === 'PRESENT'
                                ? 'PR'
                                : status === 'LATE'
                                  ? 'LT'
                                  : status === 'LEAVE'
                                    ? 'LV'
                                    : status === 'ABSENT'
                                      ? 'AB'
                                      : '—'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </DataTable>
            <DataTablePagination
              page={studentPage}
              pageCount={studentPageCount}
              itemCount={filteredStudents.length}
              pageSize={studentPageSize}
              onPageChange={setStudentPage}
              onPageSizeChange={setStudentPageSize}
            />
            <button type="button" className="button-primary" disabled={saving} onClick={saveWeek}>
              {saving ? 'Saving...' : `Save ${view}`}
            </button>
          </>
        </>
      ) : null}
    </section>
  );
}

function StudentAttendance() {
  const { data: branches = [] } = useListBranchesQuery();
  const [branchId, setBranchId] = useState('');
  const [offeringId, setOfferingId] = useState('');
  const [date, setDate] = useState(today);
  const { data: offerings = [] } = useListOfferingsQuery(branchId || skipToken);
  const roster = useGetStudentAttendanceRosterQuery(offeringId ? { offeringId, date } : skipToken);
  const [save, { isLoading: saving }] = useSaveStudentAttendanceMutation();
  const toast = useToast();
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  useEffect(() => {
    setOfferingId('');
  }, [branchId]);
  useEffect(() => {
    if (roster.data)
      setStatuses(
        Object.fromEntries(
          roster.data
            .filter((student) => student.status)
            .map((student) => [student.id, student.status as AttendanceStatus]),
        ),
      );
  }, [roster.data]);
  const students = roster.data ?? [];
  function mark(studentId: string, status: AttendanceStatus) {
    setStatuses((current) => ({ ...current, [studentId]: status }));
  }
  async function submit() {
    if (!offeringId) return;
    const records = Object.entries(statuses).map(([studentId, status]) => ({ studentId, status }));
    if (!records.length) {
      toast.error('Mark at least one student before saving.');
      return;
    }
    try {
      await save({ offeringId, attendanceDate: date, records }).unwrap();
      toast.success('Student attendance saved. Unmarked students remain unmarked.');
    } catch {
      toast.error('Student attendance could not be saved.');
    }
  }
  return (
    <section
      role="tabpanel"
      id="students-panel"
      aria-labelledby="students-tab"
      className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Campus
          <select
            className="field"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">Select a campus</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {String(branch.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Class or course
          <select
            className="field"
            disabled={!branchId}
            value={offeringId}
            onChange={(event) => setOfferingId(event.target.value)}
          >
            <option value="">Select an offering</option>
            {offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {String(
                  (offering.schoolClass as ApiRecord | undefined)?.name ??
                    (offering.course as ApiRecord | undefined)?.name ??
                    offering.id,
                )}
                {offering.sectionName ? ` · ${String(offering.sectionName)}` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Date
          <input
            className="field"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>
      {offeringId ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-teal-50 p-3">
            <p className="text-sm text-teal-950">
              Choose a status in one click. Only marked students are saved; unmarked students remain
              unmarked by design.
            </p>
            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                setStatuses(Object.fromEntries(students.map((student) => [student.id, 'PRESENT'])))
              }
            >
              Mark all present
            </button>
          </div>
          <DataTable minWidth="42rem">
            <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Registration</th>
                <th className="px-4 py-3 text-right font-semibold">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {roster.isLoading ? (
                <TableEmpty colSpan={3}>Loading class roster...</TableEmpty>
              ) : null}
              {!roster.isLoading && students.length === 0 ? (
                <TableEmpty colSpan={3}>No enrolled students in this offering.</TableEmpty>
              ) : null}
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{String(student.fullName)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {String(student.registrationNumber ?? 'Registration pending')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      {(['PRESENT', 'LATE', 'LEAVE', 'ABSENT'] as AttendanceStatus[]).map(
                        (value) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={statuses[student.id] === value}
                            onClick={() => mark(student.id, value)}
                            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${statuses[student.id] === value ? 'bg-teal-600 text-white' : 'bg-muted text-muted-foreground hover:bg-teal-50 hover:text-teal-800'}`}
                          >
                            {value[0]}
                            {value.slice(1).toLowerCase()}
                          </button>
                        ),
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <div className="hidden">
            {roster.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading class roster...</p>
            ) : null}
            {!roster.isLoading && students.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No enrolled students in this offering.
              </p>
            ) : null}
            {students.map((student) => (
              <StudentAttendanceRow
                key={student.id}
                student={student as RosterStudent}
                status={statuses[student.id]}
                onMark={mark}
              />
            ))}
          </div>
          <button type="button" className="button-primary" disabled={saving} onClick={submit}>
            {saving ? 'Saving...' : 'Save marked attendance'}
          </button>
        </>
      ) : null}
    </section>
  );
}

function StudentAttendanceRow({
  student,
  status,
  onMark,
}: {
  student: RosterStudent;
  status?: AttendanceStatus;
  onMark: (studentId: string, status: AttendanceStatus) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
      <div>
        <p className="font-medium">{String(student.fullName)}</p>
        <p className="text-xs text-muted-foreground">
          {String(student.registrationNumber ?? 'Registration pending')}
        </p>
      </div>
      <div className="flex flex-wrap gap-1">
        {(['PRESENT', 'LATE', 'LEAVE', 'ABSENT'] as AttendanceStatus[]).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => onMark(student.id, value)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${status === value ? 'bg-teal-600 text-white' : 'bg-muted text-muted-foreground hover:bg-teal-50 hover:text-teal-800'}`}
          >
            {value[0]}
            {value.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

function StaffAttendanceReports() {
  const { data: branches = [] } = useListBranchesQuery();
  const [branchId, setBranchId] = useState('');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const report = useGetStaffAttendanceReportQuery(branchId ? { branchId, from, to } : skipToken);
  const [downloadCsv] = useLazyGetStaffAttendanceCsvQuery();
  const [overrideAttendance, { isLoading: isSavingOverride }] =
    useOverrideStaffAttendanceMutation();
  const [editingRecord, setEditingRecord] = useState<ApiRecord | null>(null);
  const [checkOutAt, setCheckOutAt] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const toast = useToast();

  function startEditing(record: ApiRecord) {
    setEditingRecord(record);
    setCheckOutAt(
      record.checkOutAt ? new Date(String(record.checkOutAt)).toISOString().slice(0, 16) : '',
    );
    setOverrideReason(String(record.overrideReason ?? ''));
  }

  async function saveOverride() {
    if (!branchId || !editingRecord || !checkOutAt) return;
    try {
      await overrideAttendance({
        branchId,
        attendanceId: editingRecord.id,
        body: {
          status: String(editingRecord.status),
          checkOutAt: new Date(checkOutAt).toISOString(),
          overrideReason,
        },
      }).unwrap();
      toast.success('Staff attendance updated.');
      setEditingRecord(null);
      await report.refetch();
    } catch {
      toast.error('Could not update this attendance record.');
    }
  }
  async function download() {
    if (!branchId) return;
    const csv = await downloadCsv({ branchId, from, to }).unwrap();
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `staff-attendance-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section
      role="tabpanel"
      id="staff-panel"
      aria-labelledby="staff-tab"
      className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Campus
          <select
            className="field"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">Select a campus</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {String(branch.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          From
          <input
            className="field"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          To
          <input
            className="field"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
      </div>
      {branchId ? (
        <>
          <button type="button" className="button-secondary" onClick={download}>
            Download CSV
          </button>
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="p-3">Staff</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Check in</th>
                  <th className="p-3">Check out</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {report.isLoading ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={6}>
                      Loading attendance...
                    </td>
                  </tr>
                ) : null}
                {(report.data ?? []).map((record) => (
                  <tr
                    key={`${String(record.staffId)}-${String(record.date)}`}
                    className="border-b border-border/70"
                  >
                    <td className="p-3 font-medium">{String(record.name)}</td>
                    <td className="p-3">{String(record.date).slice(0, 10)}</td>
                    <td className="p-3">{String(record.status)}</td>
                    <td className="p-3">{String(record.checkInAt).slice(11, 16)}</td>
                    <td className="p-3">
                      {record.checkOutAt
                        ? String(record.checkOutAt).slice(11, 16)
                        : 'Not checked out'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        className="button-ghost text-xs"
                        onClick={() => startEditing(record)}
                      >
                        {record.checkOutAt ? 'Edit' : 'Add check-out'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editingRecord ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">Edit staff attendance</p>
                  <p className="text-sm text-muted-foreground">
                    {String(editingRecord.name)} · {String(editingRecord.date).slice(0, 10)}
                  </p>
                </div>
                <button
                  type="button"
                  className="button-ghost text-sm"
                  onClick={() => setEditingRecord(null)}
                >
                  Cancel
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end">
                <label className="grid gap-1 text-sm font-medium">
                  Check-out time
                  <input
                    className="field"
                    type="datetime-local"
                    value={checkOutAt}
                    onChange={(event) => setCheckOutAt(event.target.value)}
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Correction note
                  <input
                    className="field"
                    maxLength={500}
                    placeholder="For example, confirmed by the principal"
                    value={overrideReason}
                    onChange={(event) => setOverrideReason(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="button-primary"
                  disabled={!checkOutAt || isSavingOverride}
                  onClick={saveOverride}
                >
                  {isSavingOverride ? 'Saving...' : 'Save correction'}
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Choose a campus to review teacher check-ins and check-outs.
        </p>
      )}
    </section>
  );
}

function KioskSettings() {
  const { data } = useGetKioskSettingsQuery();
  const [update, { isLoading }] = useUpdateKioskSettingsMutation();
  const toast = useToast();
  const [form, setForm] = useState({
    defaultStaffShiftStart: '07:00',
    defaultStaffShiftEnd: '14:00',
    graceMinutes: 15,
    workingDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
  });
  useEffect(() => {
    if (data)
      setForm({
        defaultStaffShiftStart: String(data.defaultStaffShiftStart ?? '07:00'),
        defaultStaffShiftEnd: String(data.defaultStaffShiftEnd ?? '14:00'),
        graceMinutes: Number(data.graceMinutes ?? 15),
        workingDays: Array.isArray(data.workingDays)
          ? data.workingDays.map(String)
          : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
      });
  }, [data]);
  function toggle(day: string) {
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
    }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await update(form).unwrap();
      toast.success('Kiosk settings saved.');
    } catch {
      toast.error('Kiosk settings could not be saved. Select at least one working day.');
    }
  }
  return (
    <section
      role="tabpanel"
      id="kiosk-panel"
      aria-labelledby="kiosk-tab"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Default check-in time
          <input
            className="field"
            type="time"
            value={form.defaultStaffShiftStart}
            onChange={(event) => setForm({ ...form, defaultStaffShiftStart: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Default check-out time
          <input
            className="field"
            type="time"
            value={form.defaultStaffShiftEnd}
            onChange={(event) => setForm({ ...form, defaultStaffShiftEnd: event.target.value })}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Grace period (minutes)
          <input
            className="field"
            type="number"
            min="0"
            max="180"
            value={form.graceMinutes}
            onChange={(event) => setForm({ ...form, graceMinutes: Number(event.target.value) })}
          />
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-medium">Working days</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(
              (day) => (
                <label
                  key={day}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.workingDays.includes(day)}
                    onChange={() => toggle(day)}
                  />
                  {day[0]}
                  {day.slice(1).toLowerCase()}
                </label>
              ),
            )}
          </div>
        </fieldset>
        <button className="button-primary w-fit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save kiosk settings'}
        </button>
      </form>
    </section>
  );
}
