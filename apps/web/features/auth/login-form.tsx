'use client';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLoginMutation } from './auth.api';
import { useAppDispatch } from '@web/store/hooks';
import { setCredentials } from '@web/store/slices/auth-slice';

export function LoginForm() {
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
      const session = await login({ identifier, password }).unwrap();
      dispatch(setCredentials(session));
      router.replace(search.get('next') || '/dashboard');
    } catch {
      setError('Check your sign-in details and try again.');
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="grid gap-2 text-sm font-medium">
        Username or contact number
        <input
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          className="field"
          placeholder="admin or 03001234567"
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
          type="password"
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
