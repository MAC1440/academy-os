'use client';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginMutation } from './auth.api';
import { useAppDispatch } from '@web/store/hooks';
import { setCredentials } from '@web/store/slices/auth-slice';
import { PasswordInput } from '@web/components/password-input';

export function LoginForm({ portalType }: { portalType?: 'ADMIN' | 'LEARNER' | 'STAFF' }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const search = useSearchParams();
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const session = await login({
        identifier,
        password,
        ...(portalType ? { accountType: portalType } : {}),
      }).unwrap();
      dispatch(setCredentials(session));
      router.replace(
        search.get('next') ||
          (portalType === 'LEARNER'
            ? '/student/dashboard'
            : portalType === 'STAFF'
              ? '/staff/dashboard'
              : '/dashboard'),
      );
    } catch {
      setError('Check your sign-in details and try again.');
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="grid gap-2 text-sm font-medium">
        {portalType === 'LEARNER'
          ? 'Guardian contact number'
          : portalType === 'STAFF'
            ? 'Staff contact number'
            : 'Username or contact number'}
        <PasswordInput
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          className="field"
          placeholder={portalType ? '03001234567' : 'admin or 03001234567'}
          inputMode={portalType ? 'numeric' : undefined}
          maxLength={portalType ? 15 : 80}
          autoComplete="username"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field"
          autoComplete="current-password"
        />
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {error}
        </p>
      )}
      <button disabled={isLoading} className="button-primary w-full">
        {isLoading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
