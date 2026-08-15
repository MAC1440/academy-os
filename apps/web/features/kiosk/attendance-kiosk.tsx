'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { skipToken } from '@reduxjs/toolkit/query';
import { CheckCircle2, Clock3, LockKeyhole, MapPin, UserRound } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import {
  useKioskCheckInMutation,
  useKioskCheckOutMutation,
  useListKioskBranchesQuery,
  useListKioskStaffQuery,
} from './kiosk.api';
import type { ApiRecord } from '@web/store/api/base-api';

type KioskAttendance = ApiRecord & {
  checkInAt?: string;
  checkOutAt?: string | null;
  status?: string;
};
type KioskStaff = ApiRecord & { user?: ApiRecord; todayAttendance?: KioskAttendance | null };
type AttendanceTab = 'pending' | 'checked-in' | 'checked-out';

const attendanceTabs: { id: AttendanceTab; label: string }[] = [
  { id: 'pending', label: 'Pending check-ins' },
  { id: 'checked-in', label: 'Checked in' },
  { id: 'checked-out', label: 'Checked out' },
];

function staffAttendanceState(staff: KioskStaff): AttendanceTab {
  if (!staff.todayAttendance?.checkInAt) return 'pending';
  return staff.todayAttendance.checkOutAt ? 'checked-out' : 'checked-in';
}

function timeOf(value?: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-PK', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'Asia/Karachi',
      }).format(new Date(value))
    : '';
}

export function AttendanceKiosk() {
  const { data: branches = [] } = useListKioskBranchesQuery();
  const [branchId, setBranchId] = useState('');
  const { data: staff = [], isLoading } = useListKioskStaffQuery(branchId || skipToken);
  const [activeTab, setActiveTab] = useState<AttendanceTab>('pending');
  const [selectedStaff, setSelectedStaff] = useState<KioskStaff | null>(null);
  const [action, setAction] = useState<'check-in' | 'check-out'>('check-in');
  const [pin, setPin] = useState('');
  const [checkIn, { isLoading: checkingIn }] = useKioskCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useKioskCheckOutMutation();
  const toast = useToast();
  function chooseStaff(member: KioskStaff) {
    const state = staffAttendanceState(member);
    if (state === 'checked-out') return;
    setSelectedStaff(member);
    setPin('');
    setAction(state === 'checked-in' ? 'check-out' : 'check-in');
  }
  const staffByTab = attendanceTabs.reduce(
    (groups, tab) => ({
      ...groups,
      [tab.id]: (staff as KioskStaff[]).filter((member) => staffAttendanceState(member) === tab.id),
    }),
    {} as Record<AttendanceTab, KioskStaff[]>,
  );
  const kioskDate = new Intl.DateTimeFormat('en-PK', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Karachi',
  }).format(new Date());
  function close() {
    setSelectedStaff(null);
    setPin('');
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedStaff || !branchId || pin.length !== 4) return;
    try {
      if (action === 'check-in')
        await checkIn({ branchId, body: { staffId: selectedStaff.id, pin } }).unwrap();
      else await checkOut({ branchId, body: { staffId: selectedStaff.id, pin } }).unwrap();
      toast.success(action === 'check-in' ? 'Check-in recorded.' : 'Check-out recorded.');
      close();
    } catch {
      toast.error(
        action === 'check-in'
          ? 'Check-in could not be recorded. Confirm the PIN or use check-out if already checked in.'
          : 'Check-out could not be recorded. Confirm the PIN and today’s check-in.',
      );
    }
  }
  return (
    <main className="kiosk-shell">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link href="/" className="brand-mark text-xl">
          Vision <span className="text-[var(--accent)]">Preparation</span> Academy
        </Link>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)]">
          <Clock3 size={16} />
          {kioskDate}
        </span>
      </header>
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Teacher attendance kiosk</p>
          <h1 className="mt-3 font-display text-5xl tracking-[-.06em] text-[var(--brand-deep)] sm:text-6xl">
            Tap your name. Enter your PIN.
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            Select your campus, find your name, then check in or check out using your four-digit
            kiosk PIN.
          </p>
        </div>
        <div className="mt-10 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_1.5rem_4rem_rgba(53,8,14,.08)] sm:p-7">
          <label className="grid max-w-md gap-2 text-sm font-semibold">
            Campus
            <select
              className="field"
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value);
                setActiveTab('pending');
                close();
              }}
            >
              <option value="">Choose your campus</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {String(branch.name)}
                  {branch.city ? ` · ${String(branch.city)}` : ''}
                </option>
              ))}
            </select>
          </label>
          {branchId ? (
            <>
              <div className="mt-7 flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <MapPin size={17} className="text-[var(--brand)]" />
                <h2 className="font-display text-2xl text-[var(--foreground)]">
                  Who is checking in?
                </h2>
              </div>
              <div
                role="tablist"
                aria-label="Today's staff attendance"
                className="mt-4 flex gap-2 overflow-x-auto pb-1"
              >
                {attendanceTabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                      className={`shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${active ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]' : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--accent)]'}`}
                    >
                      {tab.label}{' '}
                      <span className="ml-1 opacity-75">{staffByTab[tab.id].length}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? <p className="text-sm text-[var(--muted)]">Loading staff...</p> : null}
                {!isLoading && staff.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    No active staff have been assigned to this campus.
                  </p>
                ) : null}
                {!isLoading && staff.length > 0 && staffByTab[activeTab].length === 0 ? (
                  <p className="rounded-xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--brand-deep)]">
                    No staff are in this group yet today.
                  </p>
                ) : null}
                {staffByTab[activeTab].map((member) => {
                  const state = staffAttendanceState(member);
                  const attendance = member.todayAttendance;
                  const isComplete = state === 'checked-out';
                  return (
                    <button
                      key={member.id}
                      type="button"
                      disabled={isComplete}
                      onClick={() => chooseStaff(member)}
                      className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--focus)] ${isComplete ? 'cursor-default border-[var(--border)] bg-[var(--accent-soft)] opacity-80' : 'border-[var(--border)] bg-[var(--background)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">
                            {String(member.user?.fullName ?? 'Staff member')}
                          </p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {String(member.designation ?? member.staffType ?? 'Staff')}
                          </p>
                        </div>
                        {isComplete ? (
                          <CheckCircle2
                            size={19}
                            className="shrink-0 text-emerald-700"
                            aria-label="Checked out"
                          />
                        ) : (
                          <UserRound size={19} className="shrink-0 text-[var(--brand)]" />
                        )}
                      </div>
                      <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                        {state === 'pending'
                          ? 'Ready to check in'
                          : state === 'checked-in'
                            ? `Checked in at ${timeOf(attendance?.checkInAt)} · tap to check out`
                            : `Checked out at ${timeOf(attendance?.checkOutAt)}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="mt-8 rounded-xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--brand-deep)]">
              Choose the campus device is placed in to see its assigned staff.
            </div>
          )}
        </div>
      </section>
      {selectedStaff ? (
        <div
          role="presentation"
          className="fixed inset-0 z-40 grid place-items-center bg-[rgba(48,19,22,.5)] p-4"
          onMouseDown={close}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="kiosk-pin-title"
            className="w-full max-w-md rounded-3xl bg-[var(--card)] p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={close}
              className="ml-auto block rounded-md px-2 py-1 text-sm text-[var(--muted)] hover:bg-[var(--accent-soft)]"
            >
              Cancel
            </button>
            <div className="mt-2 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--brand)]">
                <LockKeyhole size={21} />
              </span>
              <h2
                id="kiosk-pin-title"
                className="mt-4 font-display text-3xl text-[var(--brand-deep)]"
              >
                {String(selectedStaff.user?.fullName)}
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Enter your private four-digit kiosk PIN.
              </p>
            </div>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-center text-sm font-semibold text-[var(--brand-deep)]">
                {action === 'check-in' ? 'Check in for today' : 'Check out for today'}
              </p>
              <label className="grid gap-2 text-sm font-semibold">
                Four-digit PIN
                <input
                  autoFocus
                  className="field text-center text-2xl tracking-[.7em]"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                />
              </label>
              <button
                className="button-primary w-full"
                disabled={pin.length !== 4 || checkingIn || checkingOut}
              >
                {checkingIn || checkingOut
                  ? 'Recording...'
                  : action === 'check-in'
                    ? 'Confirm check-in'
                    : 'Confirm check-out'}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
