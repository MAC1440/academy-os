'use client';

import { FormEvent, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import type { ApiRecord } from '@web/store/api/base-api';

type CatalogInput = {
  name: string;
  code?: string;
  description?: string;
  sectionsEnabled?: boolean;
};
type CatalogPanelProps = {
  itemName: string;
  description: string;
  records: ApiRecord[];
  isLoading: boolean;
  allowCode?: boolean;
  allowDescription?: boolean;
  allowSections?: boolean;
  create: (body: CatalogInput) => Promise<unknown>;
  update: (id: string, body: CatalogInput) => Promise<unknown>;
};

export function CatalogPanel({
  itemName,
  description,
  records,
  isLoading,
  allowCode,
  allowDescription,
  allowSections,
  create,
  update,
}: CatalogPanelProps) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CatalogInput>({
    name: '',
    code: '',
    description: '',
    sectionsEnabled: false,
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await create(form);
      setForm({ name: '', code: '', description: '', sectionsEnabled: false });
      setCreating(false);
      toast.success(`${itemName} added.`);
    } catch {
      toast.error(`${itemName} could not be added. Check the details and try again.`);
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        <button
          type="button"
          className="button-primary inline-flex items-center gap-2"
          onClick={() => setCreating(true)}
        >
          <Plus size={16} />
          Add {itemName.toLowerCase()}
        </button>
      </div>
      {creating ? (
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-xl border border-teal-300 bg-teal-50/60 p-4 md:grid-cols-2"
        >
          <label className="grid gap-1 text-sm font-medium">
            Name
            <input
              className="field"
              required
              autoFocus
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          {allowCode ? (
            <label className="grid gap-1 text-sm font-medium">
              Code
              <input
                className="field"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
          ) : null}
          {allowDescription ? (
            <label className="grid gap-1 text-sm font-medium md:col-span-2">
              Description
              <input
                className="field"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </label>
          ) : null}
          {allowSections ? (
            <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
              <input
                type="checkbox"
                checked={form.sectionsEnabled}
                onChange={(event) => setForm({ ...form, sectionsEnabled: event.target.checked })}
              />
              This class uses sections
            </label>
          ) : null}
          <div className="flex gap-2">
            <button className="button-primary">Save {itemName.toLowerCase()}</button>
            <button type="button" className="button-secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <div className="grid gap-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading {itemName.toLowerCase()}s...</p>
        ) : null}
        {!isLoading && records.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            No {itemName.toLowerCase()}s yet. Add the first one above.
          </p>
        ) : null}
        {records.map((record) => (
          <CatalogItem
            key={record.id}
            record={record}
            itemName={itemName}
            allowCode={allowCode}
            allowDescription={allowDescription}
            allowSections={allowSections}
            update={update}
          />
        ))}
      </div>
    </div>
  );
}

function CatalogItem({
  record,
  itemName,
  allowCode,
  allowDescription,
  allowSections,
  update,
}: Omit<CatalogPanelProps, 'description' | 'records' | 'isLoading' | 'create'> & {
  record: ApiRecord;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CatalogInput>({
    name: String(record.name ?? ''),
    code: String(record.code ?? ''),
    description: String(record.description ?? ''),
    sectionsEnabled: Boolean(record.sectionsEnabled),
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await update(record.id, form);
      toast.success(`${itemName} updated.`);
      setEditing(false);
    } catch {
      toast.error(`${itemName} could not be updated.`);
    }
  }
  if (!editing)
    return (
      <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <p className="font-medium">{String(record.name)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {allowCode && record.code ? `${String(record.code)} · ` : ''}
            {allowDescription && record.description
              ? String(record.description)
              : allowSections
                ? record.sectionsEnabled
                  ? 'Sections enabled'
                  : 'Sections not enabled'
                : 'Active'}
          </p>
        </div>
        <button
          type="button"
          className="button-secondary inline-flex items-center gap-2"
          onClick={() => setEditing(true)}
        >
          <Pencil size={14} />
          Edit
        </button>
      </article>
    );
  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-xl border border-teal-300 bg-teal-50/60 p-4 md:grid-cols-2"
    >
      <label className="grid gap-1 text-sm font-medium">
        Name
        <input
          className="field"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
      </label>
      {allowCode ? (
        <label className="grid gap-1 text-sm font-medium">
          Code
          <input
            className="field"
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
          />
        </label>
      ) : null}
      {allowDescription ? (
        <label className="grid gap-1 text-sm font-medium md:col-span-2">
          Description
          <input
            className="field"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
      ) : null}
      {allowSections ? (
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input
            type="checkbox"
            checked={form.sectionsEnabled}
            onChange={(event) => setForm({ ...form, sectionsEnabled: event.target.checked })}
          />
          This class uses sections
        </label>
      ) : null}
      <div className="flex gap-2">
        <button className="button-primary">Save changes</button>
        <button type="button" className="button-secondary" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
