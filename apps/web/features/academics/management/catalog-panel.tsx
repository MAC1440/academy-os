'use client';

import { FormEvent, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { DataTable, TableEmpty } from '@web/components/data-table';
import { useToast } from '@web/components/toast-provider';
import { useConfirmation } from '@web/components/confirmation-dialog';
import type { ApiRecord } from '@web/store/api/base-api';

type CatalogInput = {
  name: string;
  code?: string;
  description?: string;
  sectionsEnabled?: boolean;
  status?: string;
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

export function CatalogPanel(props: CatalogPanelProps) {
  const {
    itemName,
    description,
    records,
    isLoading,
    allowCode,
    allowDescription,
    allowSections,
    create,
    update,
  } = props;
  const toast = useToast();
  const { confirm } = useConfirmation();
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
        <CatalogFields
          form={form}
          setForm={setForm}
          allowCode={allowCode}
          allowDescription={allowDescription}
          allowSections={allowSections}
          onSubmit={submit}
          submitLabel={`Save ${itemName.toLowerCase()}`}
          onCancel={() => setCreating(false)}
        />
      ) : null}
      <DataTable minWidth="46rem">
        <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            {allowCode ? <th className="px-4 py-3 font-semibold">Code</th> : null}
            <th className="px-4 py-3 font-semibold">Details</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <TableEmpty colSpan={allowCode ? 4 : 3}>
              Loading {itemName.toLowerCase()}s...
            </TableEmpty>
          ) : null}
          {!isLoading && records.length === 0 ? (
            <TableEmpty colSpan={allowCode ? 4 : 3}>
              No {itemName.toLowerCase()}s yet. Add the first one above.
            </TableEmpty>
          ) : null}
          {records.map((record) => (
            <CatalogItem key={record.id} record={record} {...props} />
          ))}
        </tbody>
      </DataTable>
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
}: CatalogPanelProps & { record: ApiRecord }) {
  const toast = useToast();
  const { confirm } = useConfirmation();
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
  async function archive() {
    if (
      !(await confirm({
        title: `Remove ${itemName.toLowerCase()}?`,
        description:
          'Existing history is preserved, but it will no longer be available for new work.',
        confirmLabel: 'Remove',
      }))
    )
      return;
    try {
      await update(record.id, { ...form, status: 'ARCHIVED' });
      toast.success(`${itemName} removed.`);
    } catch {
      toast.error(`${itemName} could not be removed because it is still in use.`);
    }
  }
  const details =
    allowDescription && record.description
      ? String(record.description)
      : allowSections
        ? record.sectionsEnabled
          ? 'Sections enabled'
          : 'Sections not enabled'
        : 'Active';
  const colSpan = allowCode ? 4 : 3;
  return (
    <>
      <tr className="hover:bg-muted/30">
        <td className="px-4 py-3 font-medium">{String(record.name)}</td>
        {allowCode ? (
          <td className="px-4 py-3 text-muted-foreground">{String(record.code ?? '—')}</td>
        ) : null}
        <td className="px-4 py-3 text-muted-foreground">{details}</td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
              onClick={() => setEditing(!editing)}
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              type="button"
              className="text-sm font-semibold text-destructive hover:underline"
              onClick={archive}
            >
              Remove
            </button>
          </div>
        </td>
      </tr>
      {editing ? (
        <tr className="bg-teal-50/60">
          <td colSpan={colSpan} className="p-4">
            <CatalogFields
              form={form}
              setForm={setForm}
              allowCode={allowCode}
              allowDescription={allowDescription}
              allowSections={allowSections}
              onSubmit={submit}
              submitLabel="Save changes"
              onCancel={() => setEditing(false)}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function CatalogFields({
  form,
  setForm,
  allowCode,
  allowDescription,
  allowSections,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  form: CatalogInput;
  setForm: (form: CatalogInput) => void;
  allowCode?: boolean;
  allowDescription?: boolean;
  allowSections?: boolean;
  onSubmit: (event: FormEvent) => void;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
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
        <button className="button-primary">{submitLabel}</button>
        <button type="button" className="button-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
