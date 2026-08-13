'use client';

import { FormEvent, useEffect, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { BookMarked, Pencil, Plus, Trash2 } from 'lucide-react';
import { DataTable, DataTableControls, TableEmpty } from '@web/components/data-table';
import { useToast } from '@web/components/toast-provider';
import { useListBranchesQuery } from '@web/features/organization/organization.api';
import {
  useCreateOfferingMutation,
  useDeleteOfferingMutation,
  useListAcademicGroupsQuery,
  useListCoursesQuery,
  useListOfferingsQuery,
  useListSchoolClassesQuery,
  useListSubjectsQuery,
  useReplaceOfferingSubjectsMutation,
  useUpdateOfferingMutation,
} from '../academics.api';
import type { ApiRecord } from '@web/store/api/base-api';

type Offering = ApiRecord & {
  schoolClass?: ApiRecord;
  course?: ApiRecord;
  academicGroup?: ApiRecord;
  subjects?: Array<ApiRecord & { subject?: ApiRecord }>;
};

export function BranchOfferingsPanel() {
  const { data: branches = [] } = useListBranchesQuery();
  const [branchId, setBranchId] = useState('');
  useEffect(() => {
    if (!branchId && branches[0]) setBranchId(branches[0].id);
  }, [branchId, branches]);
  const offerings = useListOfferingsQuery(branchId || skipToken);
  const { data: schoolClasses = [] } = useListSchoolClassesQuery();
  const { data: courses = [] } = useListCoursesQuery();
  const { data: groups = [] } = useListAcademicGroupsQuery();
  const { data: subjects = [] } = useListSubjectsQuery();
  const [create] = useCreateOfferingMutation();
  const [update] = useUpdateOfferingMutation();
  const [remove] = useDeleteOfferingMutation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [subjectEditorOfferingId, setSubjectEditorOfferingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    offeringType: 'SCHOOL_CLASS' as 'SCHOOL_CLASS' | 'COURSE',
    sourceId: '',
    academicGroupId: '',
    sectionName: '',
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!branchId) return;
    const body =
      form.offeringType === 'SCHOOL_CLASS'
        ? {
            offeringType: form.offeringType,
            schoolClassId: form.sourceId,
            academicGroupId: form.academicGroupId || undefined,
            sectionName: form.sectionName || undefined,
          }
        : { offeringType: form.offeringType, courseId: form.sourceId };
    try {
      if (editingOfferingId) {
        await update({
          branchId,
          offeringId: editingOfferingId,
          body: {
            academicGroupId: form.academicGroupId || undefined,
            sectionName: form.sectionName || undefined,
          },
        }).unwrap();
      } else await create({ branchId, body }).unwrap();
      setOpen(false);
      setEditingOfferingId(null);
      setForm({ offeringType: 'SCHOOL_CLASS', sourceId: '', academicGroupId: '', sectionName: '' });
      toast.success(
        editingOfferingId
          ? 'Academic offering updated.'
          : 'Academic offering added to this branch.',
      );
    } catch {
      toast.error('Offering could not be added. Check the selected class, group, and section.');
    }
  }
  function editOffering(offering: Offering) {
    setEditingOfferingId(offering.id);
    setForm({
      offeringType: offering.offeringType as 'SCHOOL_CLASS' | 'COURSE',
      sourceId: String(offering.schoolClass?.id ?? offering.course?.id ?? ''),
      academicGroupId: String(offering.academicGroup?.id ?? ''),
      sectionName: String(offering.sectionName ?? ''),
    });
    setOpen(true);
  }
  async function deleteOffering(offering: Offering) {
    if (!window.confirm(`Delete ${String(offering.schoolClass?.name ?? offering.course?.name)}?`))
      return;
    try {
      await remove({ branchId, offeringId: offering.id }).unwrap();
      if (subjectEditorOfferingId === offering.id) setSubjectEditorOfferingId(null);
      toast.success('Academic offering deleted.');
    } catch {
      toast.error('Move or delete enrolled students before deleting this offering.');
    }
  }
  const visibleOfferings = (offerings.data ?? []).filter((item) => {
    const offering = item as Offering;
    return `${String(offering.schoolClass?.name ?? offering.course?.name ?? '')} ${String(offering.academicGroup?.name ?? '')} ${String(offering.sectionName ?? '')}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
  });
  const sourceOptions = form.offeringType === 'SCHOOL_CLASS' ? schoolClasses : courses;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="grid gap-1 text-sm font-medium">
          Campus
          <select
            className="field min-w-56"
            value={branchId}
            onChange={(event) => setBranchId(event.target.value)}
          >
            <option value="">Select a campus</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {String(branch.name)}
              </option>
            ))}
          </select>
        </label>
        {branchId ? (
          <button
            type="button"
            className="button-primary inline-flex items-center gap-2"
            onClick={() => {
              setEditingOfferingId(null);
              setForm({
                offeringType: 'SCHOOL_CLASS',
                sourceId: '',
                academicGroupId: '',
                sectionName: '',
              });
              setOpen(true);
            }}
          >
            <Plus size={16} />
            Add offering
          </button>
        ) : null}
      </div>
      {branches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          Create a branch first, then return here to make its classes and courses available.
        </p>
      ) : null}
      {open ? (
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-xl border border-teal-300 bg-teal-50/60 p-4 md:grid-cols-2"
        >
          <label className="grid gap-1 text-sm font-medium">
            Offering type{' '}
            {editingOfferingId ? (
              <span className="font-normal text-muted-foreground">(fixed after creation)</span>
            ) : null}
            <select
              className="field"
              disabled={Boolean(editingOfferingId)}
              value={form.offeringType}
              onChange={(event) =>
                setForm({
                  offeringType: event.target.value as 'SCHOOL_CLASS' | 'COURSE',
                  sourceId: '',
                  academicGroupId: '',
                  sectionName: '',
                })
              }
            >
              <option value="SCHOOL_CLASS">School class</option>
              <option value="COURSE">Course</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium">
            {form.offeringType === 'SCHOOL_CLASS' ? 'School class' : 'Course'}
            <select
              className="field"
              required
              disabled={Boolean(editingOfferingId)}
              value={form.sourceId}
              onChange={(event) => setForm({ ...form, sourceId: event.target.value })}
            >
              <option value="">Select one</option>
              {sourceOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {String(item.name)}
                </option>
              ))}
            </select>
          </label>
          {form.offeringType === 'SCHOOL_CLASS' ? (
            <>
              <label className="grid gap-1 text-sm font-medium">
                Academic group <span className="font-normal text-muted-foreground">(optional)</span>
                <select
                  className="field"
                  value={form.academicGroupId}
                  onChange={(event) => setForm({ ...form, academicGroupId: event.target.value })}
                >
                  <option value="">No group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {String(group.name)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium">
                Section <span className="font-normal text-muted-foreground">(if enabled)</span>
                <input
                  className="field"
                  value={form.sectionName}
                  onChange={(event) => setForm({ ...form, sectionName: event.target.value })}
                  placeholder="A"
                />
              </label>
            </>
          ) : null}
          <div className="flex gap-2">
            <button className="button-primary">
              {editingOfferingId ? 'Save changes' : 'Save offering'}
            </button>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                setOpen(false);
                setEditingOfferingId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <DataTableControls
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search class, course, group, or section"
        sortValue="name"
        onSortChange={() => undefined}
        sortOptions={[{ value: 'name', label: 'Name: A to Z' }]}
      />
      {branchId && offerings.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading offerings...</p>
      ) : null}
      {branchId && !offerings.isLoading && (offerings.data?.length ?? 0) === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
          No offerings at this campus yet. Add a class or course to begin enrollment.
        </p>
      ) : null}
      <DataTable minWidth="46rem">
        <thead className="border-b border-border bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Class or course</th>
            <th className="px-4 py-3 font-semibold">Group / section</th>
            <th className="px-4 py-3 font-semibold">Subjects</th>
            <th className="px-4 py-3 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {!offerings.isLoading && (offerings.data?.length ?? 0) === 0 ? (
            <TableEmpty colSpan={4}>No classes or courses at this campus yet.</TableEmpty>
          ) : null}
          {visibleOfferings.map((item) => {
            const offering = item as Offering;
            const title = String(
              offering.schoolClass?.name ?? offering.course?.name ?? 'Academic offering',
            );
            const placement =
              [
                offering.academicGroup?.name,
                offering.sectionName ? `Section ${String(offering.sectionName)}` : '',
              ]
                .filter(Boolean)
                .join(' · ') || '—';
            const subjectCount = offering.subjects?.length ?? 0;
            return (
              <tr
                key={offering.id}
                className={
                  subjectEditorOfferingId === offering.id ? 'bg-teal-50/70' : 'hover:bg-muted/30'
                }
              >
                <td className="px-4 py-3 font-medium">{title}</td>
                <td className="px-4 py-3 text-muted-foreground">{placement}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {subjectCount ? `${subjectCount} assigned` : 'Not configured'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      onClick={() => editOffering(offering)}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-teal-700 hover:underline"
                      onClick={() => setSubjectEditorOfferingId(offering.id)}
                    >
                      Manage subjects
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline"
                      onClick={() => deleteOffering(offering)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
      {subjectEditorOfferingId ? (
        <div className="mt-5">
          {(offerings.data ?? [])
            .filter((item) => item.id === subjectEditorOfferingId)
            .map((offering) => (
              <OfferingCard
                key={offering.id}
                branchId={branchId}
                offering={offering as Offering}
                subjects={subjects}
              />
            ))}
        </div>
      ) : null}
    </div>
  );
}

function OfferingCard({
  branchId,
  offering,
  subjects,
}: {
  branchId: string;
  offering: Offering;
  subjects: ApiRecord[];
}) {
  const toast = useToast();
  const [replaceSubjects] = useReplaceOfferingSubjectsMutation();
  const [editing, setEditing] = useState(false);
  const assignedIds = (offering.subjects ?? [])
    .map((item) => String(item.subject?.id ?? item.subjectId ?? ''))
    .filter(Boolean);
  const [selectedIds, setSelectedIds] = useState(assignedIds);
  function toggle(subjectId: string) {
    setSelectedIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    );
  }
  async function saveSubjects() {
    try {
      await replaceSubjects({
        branchId,
        offeringId: offering.id,
        subjectIds: selectedIds,
      }).unwrap();
      toast.success('Offering subjects saved.');
      setEditing(false);
    } catch {
      toast.error('Offering subjects could not be saved.');
    }
  }
  const title = String(offering.schoolClass?.name ?? offering.course?.name ?? 'Academic offering');
  const group = offering.academicGroup?.name ? ` · ${String(offering.academicGroup.name)}` : '';
  const section = offering.sectionName ? ` · Section ${String(offering.sectionName)}` : '';
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookMarked size={17} className="text-teal-700" />
            <p className="font-medium">{title}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {offering.offeringType === 'SCHOOL_CLASS' ? 'School class' : 'Course'}
            {group}
            {section}
          </p>
        </div>
        <button type="button" className="button-secondary" onClick={() => setEditing(!editing)}>
          {editing ? 'Close subjects' : 'Manage subjects'}
        </button>
      </div>
      {editing ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-medium">Subjects offered</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {subjects.map((subject) => (
              <label
                key={subject.id}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(subject.id)}
                  onChange={() => toggle(subject.id)}
                />
                {String(subject.name)}
              </label>
            ))}
          </div>
          <button type="button" className="button-primary mt-3" onClick={saveSubjects}>
            Save subjects
          </button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Subjects:{' '}
          {assignedIds.length
            ? (offering.subjects ?? [])
                .map((item) => String(item.subject?.name ?? ''))
                .filter(Boolean)
                .join(', ')
            : 'Not configured'}
        </p>
      )}
    </article>
  );
}
