'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useMeQuery, useUpdateProfileMutation } from '@web/features/auth/auth.api';
import { useToast } from '@web/components/toast-provider';
import { useAppDispatch } from '@web/store/hooks';
import { setUser } from '@web/store/slices/auth-slice';

export function AdministratorProfileForm() {
  const { data: user } = useMeQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    contactNumber: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      username: user.username ?? '',
      fullName: user.fullName ?? '',
      contactNumber: user.contactNumber ?? '',
      email: user.email ?? '',
    }));
  }, [user]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast.error('New password and confirmation must match.');
      return;
    }
    if (form.newPassword && form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    try {
      const updated = await updateProfile({
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        ...(form.contactNumber.trim() ? { contactNumber: form.contactNumber.trim() } : {}),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.newPassword ? { newPassword: form.newPassword } : {}),
      }).unwrap();
      dispatch(setUser(updated));
      setForm((current) => ({ ...current, newPassword: '', confirmPassword: '' }));
      toast.success('Administrator profile updated.');
    } catch {
      toast.error('Profile could not be updated. That username is already in use.');
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-1 text-sm font-medium">
        Username
        <input
          className="field"
          required
          value={form.username}
          onChange={(event) => setForm({ ...form, username: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Full name
        <input
          className="field"
          required
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Contact number
        <input
          className="field"
          inputMode="numeric"
          maxLength={15}
          value={form.contactNumber}
          onChange={(event) =>
            setForm({ ...form, contactNumber: event.target.value.replace(/\D/g, '') })
          }
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Email address <span className="font-normal text-muted-foreground">(optional)</span>
        <input
          className="field"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        New password <span className="font-normal text-muted-foreground">(optional)</span>
        <input
          className="field"
          type="password"
          minLength={8}
          value={form.newPassword}
          onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Confirm new password
        <input
          className="field"
          type="password"
          minLength={8}
          value={form.confirmPassword}
          onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
        />
      </label>
      <p className="text-sm leading-6 text-muted-foreground md:col-span-2">
        Leave the password fields empty to keep your existing password. Your updated username is
        used the next time you sign in.
      </p>
      <button className="button-primary w-fit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  );
}
