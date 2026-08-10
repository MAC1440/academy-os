'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { CalendarCheck2, Clock3, UsersRound } from 'lucide-react';
import { useListOfferingsQuery } from '@web/features/academics/academics.api';
import { useToast } from '@web/components/toast-provider';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import {
  useGetKioskSettingsQuery,
  useUpdateKioskSettingsMutation,
} from '@web/features/kiosk/kiosk.api';
import {
  useGetStaffAttendanceReportQuery,
  useLazyGetStaffAttendanceCsvQuery,
} from '@web/features/reports/reports.api';
import {
  useGetStudentAttendanceRosterQuery,
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
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('students');
  return (
    <div className="space-y-6">
      <header className="max-w-2xl">
        <p className="eyebrow">Attendance operations</p>
        <h1 className="mt-2 font-display text-4xl tracking-[-.05em]">
          Fast marking. Clear records.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Mark student attendance directly from the class roster, review staff check-ins by campus,
          and configure the default kiosk workday.
        </p>
      </header>
      <div
        role="tablist"
        aria-label="Attendance operations"
        className="flex gap-2 overflow-x-auto border-b border-border pb-3"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
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
      {activeTab === 'students' ? <StudentAttendance /> : null}
      {activeTab === 'staff' ? <StaffAttendanceReports /> : null}
      {activeTab === 'kiosk' ? <KioskSettings /> : null}
    </div>
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
          <div className="grid gap-2">
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
                </tr>
              </thead>
              <tbody>
                {report.isLoading ? (
                  <tr>
                    <td className="p-3 text-muted-foreground" colSpan={5}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
