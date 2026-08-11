'use client';

import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable, TableEmpty } from '@web/components/data-table';
import { useToast } from '@web/components/toast-provider';
import {
  useCreateAcademicGroupMutation,
  useListAcademicGroupsQuery,
  useListSchoolClassesQuery,
  useUpdateAcademicGroupMutation,
} from '../academics.api';

export function AcademicGroupsPanel() {
  const { data: groups = [] } = useListAcademicGroupsQuery();
  const { data: schoolClasses = [] } = useListSchoolClassesQuery();
  const [create] = useCreateAcademicGroupMutation();
  const [update] = useUpdateAcademicGroupMutation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', schoolClassIds: [] as string[] });

  function toggle(classId: string) {
    setForm((current) => ({
      ...current,
      schoolClassIds: current.schoolClassIds.includes(classId)
        ? current.schoolClassIds.filter((id) => id !== classId)
        : [...current.schoolClassIds, classId],
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await create(form).unwrap();
      setForm({ name: '', code: '', schoolClassIds: [] });
      setOpen(false);
      toast.success('Academic group added.');
    } catch {
      toast.error('Academic group could not be added. Select at least one class.');
    }
  }

  async function removeGroup(id: string, name: string) {
    if (
      !window.confirm(`Remove ${name}? It can be restored later if it has no active offerings.`)
    ) {
      return;
    }
    try {
      await update({ id, body: { status: 'ARCHIVED' } }).unwrap();
      toast.success('Academic group removed.');
    } catch {
      toast.error(
        'This group is still used by an active class offering. Move or archive it first.',
      );
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Use groups for streams such as Pre-Medical, ICS, Computer, or Arts. A group can be
          available to multiple school classes.
        </p>
        <button
          type="button"
          className="button-primary inline-flex items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus size={16} />
          Add group
        </button>
      </div>
      {open ? (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-teal-300 bg-teal-50/60 p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Group name
              <input
                className="field"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Code
              <input
                className="field"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Available for classes</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {schoolClasses.map((schoolClass) => (
                <label
                  key={schoolClass.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.schoolClassIds.includes(schoolClass.id)}
                    onChange={() => toggle(schoolClass.id)}
                  />
                  {String(schoolClass.name)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button className="button-primary">Save group</button>
            <button type="button" className="button-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <DataTable minWidth="42rem">
        <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Group</th>
            <th className="px-4 py-3 font-semibold">Code</th>
            <th className="px-4 py-3 font-semibold">Available classes</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {groups.length === 0 ? (
            <TableEmpty colSpan={4}>No academic groups yet.</TableEmpty>
          ) : null}
          {groups.map((group) => {
            const classes = Array.isArray(group.schoolClasses)
              ? group.schoolClasses
                  .map((item) => {
                    const schoolClass = (item as Record<string, unknown>).schoolClass as
                      Record<string, unknown> | undefined;
                    return String(schoolClass?.name ?? '');
                  })
                  .filter(Boolean)
                  .join(', ')
              : 'No classes';
            return (
              <tr key={group.id}>
                <td className="px-4 py-3 font-medium">{String(group.name)}</td>
                <td className="px-4 py-3 text-muted-foreground">{String(group.code ?? '—')}</td>
                <td className="px-4 py-3 text-muted-foreground">{classes || 'No classes'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="text-sm font-semibold text-destructive hover:underline"
                    onClick={() => removeGroup(group.id, String(group.name))}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </div>
  );
}
