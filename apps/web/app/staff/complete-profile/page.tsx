'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompleteProfileMutation } from '@web/features/auth/auth.api';
import { useAppDispatch } from '@web/store/hooks';
import { setUser } from '@web/store/slices/auth-slice';
import { AuthGuard } from '@web/features/auth';
function StaffCompleteProfile() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [complete, { isLoading }] = useCompleteProfileMutation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    try {
      const user = await complete({ newPassword: password }).unwrap();
      dispatch(setUser(user));
      router.replace('/staff/dashboard');
    } catch {
      setError('Password could not be updated.');
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-5">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <h1 className="font-display text-3xl">Set your password</h1>
        <p className="text-sm text-muted-foreground">
          Replace the temporary password provided by your organization before accessing the staff
          workspace.
        </p>
        <label className="grid gap-2 text-sm font-medium">
          New password
          <input
            className="field"
            required
            minLength={8}
            maxLength={128}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Confirm password
          <input
            className="field"
            required
            minLength={8}
            maxLength={128}
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button className="button-primary w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Continue to workspace'}
        </button>
      </form>
    </main>
  );
}

export default function StaffCompleteProfilePage() {
  return (
    <AuthGuard allowed={['STAFF']}>
      <StaffCompleteProfile />
    </AuthGuard>
  );
}
