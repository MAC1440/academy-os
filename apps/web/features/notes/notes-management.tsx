'use client';

import { FormEvent, useState } from 'react';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@web/components/toast-provider';
import type { ApiRecord } from '@web/store/api/base-api';
import {
  useCreateNoteMutation,
  useDeleteNoteMutation,
  useListNotesQuery,
  useUpdateNoteMutation,
} from './notes.api';

type Note = ApiRecord & { author?: ApiRecord };

export function NotesManagement() {
  const { data: notes = [], isLoading, refetch } = useListNotesQuery();
  const [create] = useCreateNoteMutation();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  async function submit(event: FormEvent) {
    event.preventDefault();
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
          <label className="grid gap-1 text-sm font-medium">
            Title
            <input
              className="field"
              required
              autoFocus
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="e.g. Saturday mock test"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Note
            <textarea
              className="field min-h-32 resize-y"
              required
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              placeholder="Write the details your team needs."
            />
          </label>
          <div className="flex gap-2">
            <button className="button-primary">Share note</button>
            <button type="button" className="button-secondary" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading notes...</p> : null}
      {!isLoading && notes.length === 0 ? (
        <div className="max-w-xl py-10 text-center">
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
        {notes.map((item) => (
          <NoteRow key={item.id} note={item as Note} onChanged={refetch} />
        ))}
      </div>
    </div>
  );
}

function NoteRow({ note, onChanged }: { note: Note; onChanged: () => unknown }) {
  const [update] = useUpdateNoteMutation();
  const [remove] = useDeleteNoteMutation();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: String(note.title), content: String(note.content) });
  async function save(event: FormEvent) {
    event.preventDefault();
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
    if (!window.confirm('Remove this shared note?')) return;
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
        <input
          className="field"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
        />
        <textarea
          className="field min-h-28 resize-y"
          required
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
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
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {String(note.content)}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Updated {String(note.updatedAt).slice(0, 10)} by{' '}
            {String(note.author?.fullName ?? 'Team member')}
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
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-destructive hover:underline"
            onClick={archive}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
    </article>
  );
}
