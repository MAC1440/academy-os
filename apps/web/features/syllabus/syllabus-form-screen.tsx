'use client';

import { skipToken } from '@reduxjs/toolkit/query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useToast } from '@web/components/toast-provider';
import {
  useListSchoolClassesQuery,
  useListSubjectsQuery,
} from '@web/features/academics/academics.api';
import { SyllabusEditor } from './syllabus-editor';
import {
  type SyllabusClass,
  useCreateSessionSyllabusMutation,
  useGetSessionSyllabusQuery,
  useUpdateSessionSyllabusMutation,
} from './syllabus.api';

export function SyllabusFormScreen({ syllabusId }: { syllabusId?: string }) {
  const editing = Boolean(syllabusId);
  const syllabus = useGetSessionSyllabusQuery(syllabusId || skipToken);
  const classes = useListSchoolClassesQuery();
  const subjects = useListSubjectsQuery();
  const [create, createState] = useCreateSessionSyllabusMutation();
  const [update, updateState] = useUpdateSessionSyllabusMutation();
  const [sessionYear, setSessionYear] = useState('');
  const [draft, setDraft] = useState<SyllabusClass[]>([]);
  const [loadedClasses, setLoadedClasses] = useState<SyllabusClass[]>([]);
  const [loadedVersion, setLoadedVersion] = useState('');
  const toast = useToast();
  const router = useRouter();
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(loadedClasses),
    [draft, loadedClasses],
  );

  useEffect(() => {
    if (!syllabus.data) return;
    setSessionYear(syllabus.data.sessionYear);
    setDraft(syllabus.data.classes);
    setLoadedClasses(syllabus.data.classes);
    setLoadedVersion(syllabus.data.updatedAt);
  }, [syllabus.data]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validateDraft(draft);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      const saved = editing
        ? await update({
            id: syllabusId!,
            expectedUpdatedAt: loadedVersion,
            classes: draft,
          }).unwrap()
        : await create({ sessionYear: sessionYear.trim(), classes: draft }).unwrap();
      toast.success(editing ? 'Syllabus saved.' : `Syllabus session ${saved.sessionYear} created.`);
      router.push(`/syllabus/${saved.id}`);
    } catch (error: unknown) {
      toast.error(
        apiErrorMessage(
          error,
          editing
            ? 'The syllabus could not be saved. Your edits are still here.'
            : 'The syllabus session could not be created.',
        ),
      );
    }
  }

  if (editing && syllabus.isLoading)
    return <p className="text-sm text-muted-foreground">Loading syllabus…</p>;
  if (editing && (syllabus.isError || !syllabus.data))
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border p-8 text-center">
        <h1 className="font-display text-2xl">Syllabus unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been archived.</p>
        <Link href="/syllabus" className="button-primary mt-5 inline-flex">
          Return to syllabus
        </Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-6">
        <Link
          href={editing ? `/syllabus/${syllabusId}` : '/syllabus'}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:underline"
        >
          <ArrowLeft size={16} /> {editing ? 'Back to syllabus' : 'Back to sessions'}
        </Link>
        <h1 className="font-display text-4xl tracking-[-.04em]">
          {editing ? `Edit syllabus ${sessionYear}` : 'Create syllabus session'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Build the curriculum by class, group, and subject. Existing content opens as a formatted
          preview and can be switched into editing mode.
        </p>
      </header>
      <form onSubmit={submit} className="space-y-6">
        {!editing ? (
          <label className="grid max-w-sm gap-1 text-sm font-medium">
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
        ) : null}
        <SyllabusEditor
          classes={draft}
          onChange={setDraft}
          classSuggestions={classes.data ?? []}
          subjectSuggestions={subjects.data ?? []}
        />
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
          <p className="text-sm text-muted-foreground">
            {editing
              ? dirty
                ? 'Unsaved changes'
                : 'No unsaved changes'
              : `${draft.length} ${draft.length === 1 ? 'class' : 'classes'} added`}
          </p>
          <div className="flex gap-2">
            <Link
              href={editing ? `/syllabus/${syllabusId}` : '/syllabus'}
              className="button-secondary"
            >
              Cancel
            </Link>
            <button
              className="button-primary inline-flex items-center gap-2"
              disabled={(editing && !dirty) || createState.isLoading || updateState.isLoading}
            >
              <Save size={16} />
              {createState.isLoading || updateState.isLoading
                ? 'Saving…'
                : editing
                  ? 'Save syllabus'
                  : 'Create syllabus'}
            </button>
          </div>
        </div>
      </form>
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
