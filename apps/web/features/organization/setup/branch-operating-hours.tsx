'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Clock3, Plus, Save } from 'lucide-react';
import {
  useCreateOperatingHourMutation,
  useListOperatingHoursQuery,
  useUpdateOperatingHourMutation,
} from '../organization.api';
import type { ApiRecord } from '@web/store/api/base-api';
import { useToast } from '@web/components/toast-provider';

type OperatingHour = ApiRecord & {
  label?: string;
  opensAt?: string;
  closesAt?: string;
};

function HourEditor({ branchId, hour }: { branchId: string; hour: OperatingHour }) {
  const [update, { isLoading }] = useUpdateOperatingHourMutation();
  const toast = useToast();
  const [form, setForm] = useState({
    label: String(hour.label ?? ''),
    opensAt: String(hour.opensAt ?? '07:00'),
    closesAt: String(hour.closesAt ?? '14:00'),
  });

  useEffect(() => {
    setForm({
      label: String(hour.label ?? ''),
      opensAt: String(hour.opensAt ?? '07:00'),
      closesAt: String(hour.closesAt ?? '14:00'),
    });
  }, [hour.closesAt, hour.label, hour.opensAt]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await update({ branchId, operatingHourId: hour.id, body: form }).unwrap();
      toast.success('Operating hours saved.');
    } catch {
      toast.error('Operating hours could not be saved.');
    }
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-[1fr_auto_auto_auto]"
    >
      <input
        className="field"
        aria-label="Operating hour label"
        value={form.label}
        onChange={(event) => setForm({ ...form, label: event.target.value })}
      />
      <input
        className="field"
        aria-label="Opening time"
        type="time"
        value={form.opensAt}
        onChange={(event) => setForm({ ...form, opensAt: event.target.value })}
      />
      <input
        className="field"
        aria-label="Closing time"
        type="time"
        value={form.closesAt}
        onChange={(event) => setForm({ ...form, closesAt: event.target.value })}
      />
      <button
        className="button-secondary inline-flex items-center justify-center gap-1"
        disabled={isLoading}
      >
        <Save size={14} />
        Save
      </button>
    </form>
  );
}

export function BranchOperatingHours({
  branchId,
  branchName,
}: {
  branchId: string;
  branchName: string;
}) {
  const { data: operatingHours = [], isLoading } = useListOperatingHoursQuery(branchId);
  const [create, { isLoading: creating }] = useCreateOperatingHourMutation();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    label: 'Monday - Saturday',
    opensAt: '07:00',
    closesAt: '14:00',
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await create({ branchId, body: form }).unwrap();
      setShowForm(false);
      toast.success('Operating hours added.');
    } catch {
      toast.error('Operating hours could not be added.');
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-teal-50/60 p-4">
      <div className="flex items-center gap-2">
        <Clock3 className="text-teal-700" size={18} />
        <div>
          <h3 className="font-semibold">{branchName} operating hours</h3>
          <p className="text-sm text-muted-foreground">
            These hours are the branch&apos;s editable attendance baseline.
          </p>
        </div>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading operating hours...</p>
        ) : null}
        {!isLoading && operatingHours.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hours set yet. Add the default 7:00 AM–2:00 PM schedule below.
          </p>
        ) : null}
        {operatingHours.map((hour) => (
          <HourEditor key={hour.id} branchId={branchId} hour={hour as OperatingHour} />
        ))}
      </div>
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700"
        >
          <Plus size={16} />
          Add operating hours
        </button>
      ) : (
        <form
          onSubmit={submit}
          className="grid gap-2 rounded-lg border border-dashed border-teal-300 bg-background p-3 sm:grid-cols-[1fr_auto_auto_auto]"
        >
          <input
            className="field"
            required
            aria-label="New operating hour label"
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
          />
          <input
            className="field"
            required
            type="time"
            aria-label="New opening time"
            value={form.opensAt}
            onChange={(event) => setForm({ ...form, opensAt: event.target.value })}
          />
          <input
            className="field"
            required
            type="time"
            aria-label="New closing time"
            value={form.closesAt}
            onChange={(event) => setForm({ ...form, closesAt: event.target.value })}
          />
          <div className="flex gap-2">
            <button className="button-primary" disabled={creating}>
              Add
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
