'use client';

import { FormEvent, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { PasswordInput } from '@web/components/password-input';
import { useToast } from '@web/components/toast-provider';
import { useUpdateProfileMutation } from '@web/features/auth/auth.api';

export function StaffPinForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const toast = useToast();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^\d{4}$/.test(newPin)) {
      setError('Enter exactly four digits for the new PIN.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('The new PINs do not match.');
      return;
    }
    try {
      await updateProfile({ currentPassword, newPin }).unwrap();
      setCurrentPassword('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      toast.success('Your kiosk PIN has been changed.');
    } catch (requestError: unknown) {
      const message = apiErrorMessage(
        requestError,
        'The PIN could not be changed. Check your password and try again.',
      );
      setError(message);
    }
  }

  function clearError() {
    if (error) setError('');
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-teal-700 dark:text-teal-300">
          <KeyRound size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-2xl">Attendance kiosk PIN</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Change the private four-digit PIN used when checking in or out at the staff kiosk.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-4 lg:grid-cols-3 lg:items-end">
        <label className="grid gap-1.5 text-sm font-medium">
          Current account password
          <PasswordInput
            required
            autoComplete="current-password"
            maxLength={128}
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              clearError();
            }}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          New four-digit PIN
          <PasswordInput
            required
            inputMode="numeric"
            autoComplete="new-password"
            pattern="\d{4}"
            minLength={4}
            maxLength={4}
            value={newPin}
            onChange={(event) => {
              setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              clearError();
            }}
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Confirm new PIN
          <PasswordInput
            required
            inputMode="numeric"
            autoComplete="new-password"
            pattern="\d{4}"
            minLength={4}
            maxLength={4}
            value={confirmPin}
            onChange={(event) => {
              setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              clearError();
            }}
          />
        </label>
        <div className="lg:col-span-3">
          {error ? (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <button className="button-primary" disabled={isLoading}>
            {isLoading ? 'Changing PIN…' : 'Change kiosk PIN'}
          </button>
        </div>
      </form>
    </section>
  );
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('data' in error)) return fallback;
  const data = error.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) return fallback;
  return typeof data.message === 'string' && data.message !== 'Unauthorized'
    ? data.message
    : fallback;
}
