'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { DataTable, DataTableControls, TableEmpty } from '@web/components/data-table';
import { useToast } from '@web/components/toast-provider';
import { useConfirmation } from '@web/components/confirmation-dialog';
import {
  useCreateAcademicGroupMutation,
  useDeleteAcademicGroupMutation,
  useListAcademicGroupsQuery,
  useListSchoolClassesQuery,
  useReplaceAcademicGroupClassesMutation,
  useUpdateAcademicGroupMutation,
} from '../academics.api';
import type { ApiRecord } from '@web/store/api/base-api';

type GroupForm = { name: string; code: string; schoolClassIds: string[] };
const blankForm: GroupForm = { name: '', code: '', schoolClassIds: [] };

export function AcademicGroupsPanel() {
  const { data: groups = [] } = useListAcademicGroupsQuery();
  const { data: schoolClasses = [] } = useListSchoolClassesQuery();
  const [create, { isLoading: isCreating }] = useCreateAcademicGroupMutation();
  const [update, { isLoading: isUpdating }] = useUpdateAcademicGroupMutation();
  const [replaceClasses] = useReplaceAcademicGroupClassesMutation();
  const [remove] = useDeleteAcademicGroupMutation();
  const toast = useToast();
  const { confirm } = useConfirmation();
  const [form, setForm] = useState<GroupForm>(blankForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const visibleGroups = useMemo(
    () =>
      groups.filter((group) =>
        `${String(group.name)} ${String(group.code ?? '')}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [groups, search],
  );

  function classesFor(group: ApiRecord) {
    const linked = Array.isArray(group.schoolClasses) ? group.schoolClasses : [];
    return linked
      .map((item) =>
        String(
          (item as ApiRecord).schoolClass ? ((item as ApiRecord).schoolClass as ApiRecord).id : '',
        ),
      )
      .filter(Boolean);
  }
  function classNames(group: ApiRecord) {
    return (Array.isArray(group.schoolClasses) ? group.schoolClasses : [])
      .map((item) => String(((item as ApiRecord).schoolClass as ApiRecord | undefined)?.name ?? ''))
      .filter(Boolean)
      .join(', ');
  }
  function reset() {
    setForm(blankForm);
    setEditingId(null);
  }
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
      if (editingId && editingId !== 'new') {
        await update({
          id: editingId,
          body: { name: form.name, code: form.code || undefined },
        }).unwrap();
        await replaceClasses({ id: editingId, schoolClassIds: form.schoolClassIds }).unwrap();
        toast.success('Academic group updated.');
      } else {
        await create(form).unwrap();
        toast.success('Academic group added.');
      }
      reset();
    } catch {
      toast.error('Group could not be saved. Choose at least one valid school class.');
    }
  }
  function startEdit(group: ApiRecord) {
    setEditingId(group.id);
    setForm({
      name: String(group.name),
      code: String(group.code ?? ''),
      schoolClassIds: classesFor(group),
    });
  }
  async function deleteGroup(group: ApiRecord) {
    if (
      !(await confirm({
        description: `Delete ${String(group.name)}? It must not be used by an active offering.`,
      }))
    )
      return;
    try {
      await remove(group.id).unwrap();
      if (editingId === group.id) reset();
      toast.success('Academic group deleted.');
    } catch {
      toast.error('Move or delete the offerings using this group before deleting it.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Groups define streams such as Pre-Medical, ICS, Computer, or Arts, and can be reused by
          multiple classes.
        </p>
        {!editingId ? (
          <button
            type="button"
            className="button-primary inline-flex items-center gap-2"
            onClick={() => setEditingId('new')}
          >
            <Plus size={16} /> Add group
          </button>
        ) : null}
      </div>
      {editingId ? (
        <form
          onSubmit={submit}
          className="space-y-4 rounded-xl border border-border bg-muted/30 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">
              {editingId === 'new' ? 'New academic group' : 'Edit academic group'}
            </h3>
            <button
              type="button"
              className="button-secondary inline-flex items-center gap-1"
              onClick={reset}
            >
              <X size={15} /> Close
            </button>
          </div>
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
              Code <span className="font-normal text-muted-foreground">(optional)</span>
              <input
                className="field"
                value={form.code}
                onChange={(event) => setForm({ ...form, code: event.target.value })}
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Available for classes</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
          <button className="button-primary" disabled={isCreating || isUpdating}>
            {isCreating || isUpdating ? 'Saving...' : 'Save group'}
          </button>
        </form>
      ) : null}
      <DataTableControls
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search groups or codes"
        sortValue="name"
        onSortChange={() => undefined}
        sortOptions={[{ value: 'name', label: 'Name: A to Z' }]}
      />
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
          {visibleGroups.length === 0 ? (
            <TableEmpty colSpan={4}>No academic groups match this view.</TableEmpty>
          ) : null}
          {visibleGroups.map((group) => (
            <tr key={group.id}>
              <td className="px-4 py-3 font-medium">{String(group.name)}</td>
              <td className="px-4 py-3 text-muted-foreground">{String(group.code ?? '—')}</td>
              <td className="max-w-xl px-4 py-3 text-muted-foreground">
                {classNames(group) || 'No classes'}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    onClick={() => startEdit(group)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline"
                    onClick={() => deleteGroup(group)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
