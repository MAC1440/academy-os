'use client';

import { skipToken } from '@reduxjs/toolkit/query';
import { BookOpenCheck, Plus, Save, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useToast } from '@web/components/toast-provider';
import {
  useListSchoolClassesQuery,
  useListSubjectsQuery,
} from '@web/features/academics/academics.api';
import { useAppSelector } from '@web/store/hooks';
import { SyllabusEditor } from './syllabus-editor';
import {
  type SyllabusClass,
  useCreateSessionSyllabusMutation,
  useDeleteSessionSyllabusMutation,
  useGetSessionSyllabusQuery,
  useListSyllabusSessionsQuery,
  useUpdateSessionSyllabusMutation,
} from './syllabus.api';
import { SyllabusViewer } from './syllabus-viewer';

export function SyllabusManagement() {
  const accountType = useAppSelector((state) => state.auth.user?.accountType);
  return accountType === 'ADMIN' ? <AdminSyllabus /> : <StaffSyllabus />;
}

function StaffSyllabus() {
  const sessions = useListSyllabusSessionsQuery();
  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    if (sessions.data?.length && !sessions.data.some((item) => item.id === selectedId))
      setSelectedId(sessions.data[0]!.id);
  }, [selectedId, sessions.data]);
  const syllabus = useGetSessionSyllabusQuery(selectedId || skipToken);
  return (
    <SyllabusPageFrame
      sessions={sessions.data ?? []}
      selectedId={selectedId}
      onSelect={setSelectedId}
      loading={sessions.isLoading || syllabus.isLoading}
      error={sessions.isError || syllabus.isError}
    >
      {syllabus.data ? <SyllabusViewer classes={syllabus.data.classes} /> : null}
    </SyllabusPageFrame>
  );
}

function AdminSyllabus() {
  const sessions = useListSyllabusSessionsQuery();
  const classes = useListSchoolClassesQuery();
  const subjects = useListSubjectsQuery();
  const [selectedId, setSelectedId] = useState('');
  const syllabus = useGetSessionSyllabusQuery(selectedId || skipToken);
  const [create, createState] = useCreateSessionSyllabusMutation();
  const [update, updateState] = useUpdateSessionSyllabusMutation();
  const [archive, archiveState] = useDeleteSessionSyllabusMutation();
  const [draft, setDraft] = useState<SyllabusClass[]>([]);
  const [loadedClasses, setLoadedClasses] = useState<SyllabusClass[]>([]);
  const [loadedVersion, setLoadedVersion] = useState('');
  const [creating, setCreating] = useState(false);
  const [sessionYear, setSessionYear] = useState('');
  const toast = useToast();
  const { confirm } = useConfirmation();
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(loadedClasses),
    [draft, loadedClasses],
  );

  useEffect(() => {
    if (sessions.data?.length && !sessions.data.some((item) => item.id === selectedId))
      setSelectedId(sessions.data[0]!.id);
  }, [selectedId, sessions.data]);
  useEffect(() => {
    if (!syllabus.data) return;
    setDraft(syllabus.data.classes);
    setLoadedClasses(syllabus.data.classes);
    setLoadedVersion(syllabus.data.updatedAt);
  }, [syllabus.data]);

  async function chooseSession(id: string) {
    if (
      dirty &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        description: 'Switching sessions will restore the last saved syllabus for this session.',
        confirmLabel: 'Discard changes',
      }))
    )
      return;
    setSelectedId(id);
  }
  async function createSession(event: FormEvent) {
    event.preventDefault();
    try {
      const created = await create({ sessionYear: sessionYear.trim(), classes: [] }).unwrap();
      setSessionYear('');
      setCreating(false);
      setSelectedId(created.id);
      toast.success(`Syllabus session ${created.sessionYear} created.`);
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'The syllabus session could not be created.'));
    }
  }
  async function save() {
    if (!syllabus.data || !loadedVersion) return;
    const problem = validateDraft(draft);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      const persisted = await update({
        id: syllabus.data.id,
        expectedUpdatedAt: loadedVersion,
        classes: draft,
      }).unwrap();
      setDraft(persisted.classes);
      setLoadedClasses(persisted.classes);
      setLoadedVersion(persisted.updatedAt);
      toast.success('Syllabus saved.');
    } catch (error: unknown) {
      toast.error(
        apiErrorMessage(error, 'The syllabus could not be saved. Your edits are still here.'),
      );
    }
  }
  async function deleteSession() {
    if (!syllabus.data) return;
    if (
      !(await confirm({
        title: `Archive ${syllabus.data.sessionYear}?`,
        description:
          'This removes the complete session syllabus from staff view, including every class and subject.',
        confirmLabel: 'Archive session',
      }))
    )
      return;
    try {
      await archive(syllabus.data.id).unwrap();
      setSelectedId('');
      toast.success('Syllabus session archived.');
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'The syllabus session could not be archived.'));
    }
  }

  return (
    <SyllabusPageFrame
      sessions={sessions.data ?? []}
      selectedId={selectedId}
      onSelect={chooseSession}
      loading={sessions.isLoading || syllabus.isLoading}
      error={sessions.isError || syllabus.isError}
      actions={
        <button
          type="button"
          className="button-primary inline-flex items-center gap-2"
          onClick={() => setCreating((value) => !value)}
        >
          <Plus size={16} /> New session
        </button>
      }
    >
      {creating ? (
        <form
          onSubmit={createSession}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-end"
        >
          <label className="grid flex-1 gap-1 text-sm font-medium">
            Session year
            <input
              className="field"
              required
              pattern="\d{4}-(\d{2}|\d{4})"
              maxLength={9}
              value={sessionYear}
              onChange={(event) => setSessionYear(event.target.value)}
              placeholder="2026-27"
            />
            <span className="text-xs font-normal text-muted-foreground">
              Use YYYY-YY or YYYY-YYYY.
            </span>
          </label>
          <div className="flex gap-2">
            <button className="button-primary" disabled={createState.isLoading}>
              {createState.isLoading ? 'Creating…' : 'Create session'}
            </button>
            <button type="button" className="button-secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {syllabus.data ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">
              {dirty ? 'Unsaved changes' : `Saved ${formatDate(syllabus.data.updatedAt)}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="button-primary inline-flex items-center gap-2"
                disabled={!dirty || updateState.isLoading}
                onClick={save}
              >
                <Save size={16} /> {updateState.isLoading ? 'Saving…' : 'Save syllabus'}
              </button>
              <button
                type="button"
                className="button-destructive inline-flex items-center gap-2"
                disabled={archiveState.isLoading}
                onClick={deleteSession}
              >
                <Trash2 size={16} /> Archive session
              </button>
            </div>
          </div>
          <SyllabusEditor
            classes={draft}
            onChange={setDraft}
            classSuggestions={classes.data ?? []}
            subjectSuggestions={subjects.data ?? []}
          />
        </div>
      ) : null}
    </SyllabusPageFrame>
  );
}

function SyllabusPageFrame({
  sessions,
  selectedId,
  onSelect,
  loading,
  error,
  actions,
  children,
}: {
  sessions: Array<{ id: string; sessionYear: string }>;
  selectedId: string;
  onSelect: (id: string) => void | Promise<void>;
  loading: boolean;
  error: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-[-.04em]">Syllabus</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Keep each session’s class curriculum clear, searchable, and available to every staff
            member.
          </p>
        </div>
        {actions}
      </header>
      {sessions.length ? (
        <label className="grid max-w-xs gap-1 text-sm font-medium">
          Academic session
          <select
            className="field"
            value={selectedId}
            onChange={(event) => void onSelect(event.target.value)}
          >
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionYear}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {loading ? <p className="text-sm text-muted-foreground">Loading syllabus…</p> : null}
      {error ? (
        <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          The syllabus could not be loaded. Refresh the page and try again.
        </p>
      ) : null}
      {!loading && !error && !sessions.length ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-border text-center">
          <div className="max-w-md p-6">
            <BookOpenCheck className="mx-auto text-teal-600" size={30} />
            <h2 className="mt-4 font-display text-2xl">No syllabus sessions yet</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              An administrator can create the first session and add classes when ready.
            </p>
          </div>
        </div>
      ) : null}
      {!loading && !error ? children : null}
    </div>
  );
}

function validateDraft(classes: SyllabusClass[]) {
  const normalized = classes.map((item) => item.className.trim().toLocaleLowerCase());
  if (normalized.some((name) => !name)) return 'Every class must have a name.';
  if (new Set(normalized).size !== normalized.length)
    return 'A class can appear only once in a syllabus session.';
  for (const item of classes) {
    if (item.groups.some((group) => !group.name.trim()))
      return `Every group in ${item.className} must have a name.`;
    if (item.groups.some((group) => group.subjects.some((subject) => !subject.subjectName.trim())))
      return `Every subject in ${item.className} must have a name.`;
  }
  return null;
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('data' in error)) return fallback;
  const data = error.data;
  if (typeof data !== 'object' || data === null || !('message' in data)) return fallback;
  return typeof data.message === 'string' ? data.message : fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
