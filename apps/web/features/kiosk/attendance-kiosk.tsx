'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { skipToken } from '@reduxjs/toolkit/query';
import { Clock3, LockKeyhole, MapPin } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import {
  useKioskCheckInMutation,
  useKioskCheckOutMutation,
  useListKioskBranchesQuery,
  useListKioskStaffQuery,
} from './kiosk.api';
import type { ApiRecord } from '@web/store/api/base-api';

type KioskStaff = ApiRecord & { user?: ApiRecord };

export function AttendanceKiosk() {
  const { data: branches = [] } = useListKioskBranchesQuery();
  const [branchId, setBranchId] = useState('');
  const { data: staff = [], isLoading } = useListKioskStaffQuery(branchId || skipToken);
  const [selectedStaff, setSelectedStaff] = useState<KioskStaff | null>(null);
  const [action, setAction] = useState<'check-in' | 'check-out'>('check-in');
  const [pin, setPin] = useState('');
  const [checkIn, { isLoading: checkingIn }] = useKioskCheckInMutation();
  const [checkOut, { isLoading: checkingOut }] = useKioskCheckOutMutation();
  const toast = useToast();
  function chooseStaff(member: KioskStaff) {
    setSelectedStaff(member);
    setPin('');
    setAction('check-in');
  }
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
          Staff attendance
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
                <h2 className="font-display text-2xl">Who is checking in?</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {isLoading ? <p className="text-sm text-[var(--muted)]">Loading staff...</p> : null}
                {!isLoading && staff.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    No active staff have been assigned to this campus.
                  </p>
                ) : null}
                {staff.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => chooseStaff(member as KioskStaff)}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
                  >
                    <p className="font-semibold text-[var(--foreground)]">
                      {String((member as KioskStaff).user?.fullName ?? 'Staff member')}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {String(member.designation ?? member.staffType ?? 'Staff')}
                    </p>
                  </button>
                ))}
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('check-in')}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${action === 'check-in' ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]' : 'border-[var(--border)] text-[var(--foreground)]'}`}
                >
                  Check in
                </button>
                <button
                  type="button"
                  onClick={() => setAction('check-out')}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold ${action === 'check-out' ? 'border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]' : 'border-[var(--border)] text-[var(--foreground)]'}`}
                >
                  Check out
                </button>
              </div>
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
