'use client';
import { FormEvent, useEffect, useState } from 'react';
import { useUpdateOrganizationMutation } from '../organization.api';
import { useToast } from '@web/components/toast-provider';
import type { Organization } from './types';
export function OrganizationProfileForm({ organization }: { organization?: Organization }) {
  const [update, { isLoading }] = useUpdateOrganizationMutation();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  useEffect(() => {
    if (organization)
      setForm({
        name: String(organization.name ?? ''),
        email: String(organization.email ?? ''),
        phone: String(organization.phone ?? ''),
        address: String(organization.address ?? ''),
      });
  }, [organization]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await update(form).unwrap();
      toast.success('Organization details saved.');
    } catch {
      toast.error('Organization details could not be saved. Check the fields and try again.');
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium md:col-span-2">
        Organization name
        <input
          className="field"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Email
        <input
          className="field"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Phone
        <input
          className="field"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium md:col-span-2">
        Main address
        <input
          className="field"
          value={form.address}
          onChange={(event) => setForm({ ...form, address: event.target.value })}
        />
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <button className="button-primary" disabled={isLoading}>
          {isLoading ? 'Saving…' : 'Save organization'}
        </button>
      </div>
    </form>
  );
}
