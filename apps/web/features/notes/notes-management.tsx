'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';
import { FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useAppSelector } from '@web/store/hooks';
import type { ApiRecord } from '@web/store/api/base-api';
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useListNotesQuery,
  useUpdateNoteMutation,
} from './notes.api';
import { NOTE_CONTENT_MAX_LENGTH, NoteComposer } from './note-composer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Note = ApiRecord & { author?: ApiRecord };

export function NotesManagement() {
  const { data: notes = [], isLoading, refetch } = useListNotesQuery();
  const [create] = useCreateNoteMutation();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [search, setSearch] = useState('');
  const user = useAppSelector((state) => state.auth.user);
  const canDelete = user?.accountType === 'ADMIN';
  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        `${String(note.title)} ${String(note.content)}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
      ),
    [notes, search],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.content.length > NOTE_CONTENT_MAX_LENGTH) {
      toast.error(
        `This note exceeds the ${NOTE_CONTENT_MAX_LENGTH.toLocaleString()} character limit. Split it before saving.`,
      );
      return;
    }
    try {
      await create(form).unwrap();
      setForm({ title: '', content: '' });
      setCreating(false);
      await refetch();
      toast.success('Note shared with your team.');
    } catch {
      toast.error('The note could not be saved. Try again.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-[-.04em]">Shared notes</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Keep handover notes, lesson reminders, and team updates in one shared place.
          </p>
        </div>
        <button
          type="button"
          className="button-primary inline-flex items-center gap-2"
          onClick={() => setCreating(true)}
        >
          <Plus size={16} /> Add note
        </button>
      </header>
      {creating ? (
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-2xl border border-teal-300 bg-teal-50/60 p-5"
        >
          <NoteComposer
            form={form}
            onChange={setForm}
            contentRef={contentRef}
            onValidationError={toast.error}
          />
          <div className="flex gap-2">
            <button className="button-primary">Share note</button>
            <button type="button" className="button-secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading notes...</p> : null}
      {notes.length ? (
        <label className="relative block max-w-lg">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            className="field pl-11"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search shared notes"
          />
        </label>
      ) : null}
      {!isLoading && notes.length === 0 ? (
        <div className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center py-10 text-center">
          <FileText className="mx-auto text-teal-600" size={28} />
          <h2 className="mt-4 font-display text-2xl">Nothing to hand over yet.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Share the first note so everyone can stay aligned.
          </p>
          <button type="button" className="button-primary mt-5" onClick={() => setCreating(true)}>
            Add the first note
          </button>
        </div>
      ) : null}
      <div className="divide-y divide-border rounded-2xl border border-border bg-card">
        {filteredNotes.map((item) => (
          <NoteRow key={item.id} note={item as Note} canDelete={canDelete} onChanged={refetch} />
        ))}
        {notes.length && filteredNotes.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No notes match that search.</p>
        ) : null}
      </div>
    </div>
  );
}

function NoteRow({
  note,
  canDelete,
  onChanged,
}: {
  note: Note;
  canDelete: boolean;
  onChanged: () => unknown;
}) {
  const [update] = useUpdateNoteMutation();
  const [remove] = useDeleteNoteMutation();
  const toast = useToast();
  const { confirm } = useConfirmation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: String(note.title), content: String(note.content) });
  const contentRef = useRef<HTMLTextAreaElement>(null);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (form.content.length > NOTE_CONTENT_MAX_LENGTH) {
      toast.error(
        `This note exceeds the ${NOTE_CONTENT_MAX_LENGTH.toLocaleString()} character limit. Split it before saving.`,
      );
      return;
    }
    try {
      await update({ id: note.id, body: form }).unwrap();
      await onChanged();
      setEditing(false);
      toast.success('Note updated.');
    } catch {
      toast.error('The note could not be updated.');
    }
  }
  async function archive() {
    if (!(await confirm({ description: 'Remove this shared note? This cannot be undone.' })))
      return;
    try {
      await remove(note.id).unwrap();
      await onChanged();
      toast.success('Note removed.');
    } catch {
      toast.error('The note could not be removed.');
    }
  }
  if (editing)
    return (
      <form onSubmit={save} className="grid gap-3 p-5">
        <NoteComposer
          form={form}
          onChange={setForm}
          contentRef={contentRef}
          onValidationError={toast.error}
        />
        <div className="flex gap-2">
          <button className="button-primary">Save</button>
          <button type="button" className="button-secondary" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  return (
    <article className="px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h2 className="font-semibold">{String(note.title)}</h2>
          <div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap text-muted-foreground dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {String(note.content)}
            </ReactMarkdown>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Created by {String(note.author?.fullName ?? 'Team member')} · Last edited{' '}
            {String(note.updatedAt).slice(0, 10)} by{' '}
            {String(
              (note.lastEditedBy as ApiRecord | undefined)?.fullName ??
                note.author?.fullName ??
                'Team member',
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} /> Edit
          </button>
          {canDelete ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline"
              onClick={archive}
            >
              <Trash2 size={14} /> Remove
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
