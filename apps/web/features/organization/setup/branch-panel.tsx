'use client';

import { FormEvent, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useCreateBranchMutation, useListBranchesQuery } from '../organization.api';
import { useToast } from '@web/components/toast-provider';
import { BranchOperatingHours } from './branch-operating-hours';
import type { Branch } from './types';

export function BranchPanel() {
  const { data: branches = [], isLoading } = useListBranchesQuery();
  const [create, { isLoading: creating }] = useCreateBranchMutation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '' });
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId) as
    Branch | undefined;

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const branch = await create(form).unwrap();
      setForm({ name: '', address: '', city: '', phone: '' });
      setSelectedBranchId(branch.id);
      setOpen(false);
      toast.success('Branch added. Set its operating hours below.');
    } catch {
      toast.error('Branch could not be added. Its address may already be in use.');
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading campuses...</p> : null}
        {branches.map((branch) => {
          const campus = branch as Branch;
          const selected = branch.id === selectedBranchId;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => setSelectedBranchId(branch.id)}
              className={`rounded-xl border bg-card p-4 text-left transition hover:border-teal-400 ${selected ? 'border-teal-500 ring-2 ring-teal-100' : 'border-border'}`}
            >
              <div className="flex gap-3">
                <MapPin className="mt-0.5 text-teal-600" size={18} />
                <div>
                  <h3 className="font-semibold">{String(campus.name)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {String(campus.address)}
                    {campus.city ? ` · ${campus.city}` : ''}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {selectedBranch ? (
        <BranchOperatingHours
          branchId={selectedBranch.id}
          branchName={String(selectedBranch.name)}
        />
      ) : null}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700"
        >
          <Plus size={16} />
          Add a branch
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-xl border border-border bg-teal-50 p-4 md:grid-cols-2"
        >
          <label className="grid gap-1 text-sm font-medium">
            Branch name
            <input
              className="field"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            City
            <input
              className="field"
              value={form.city}
              onChange={(event) => setForm({ ...form, city: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium md:col-span-2">
            Unique address
            <input
              className="field"
              required
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Phone
            <input
              className="field"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </label>
          <div className="flex items-end gap-2">
            <button className="button-primary" disabled={creating}>
              {creating ? 'Adding...' : 'Add branch'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
