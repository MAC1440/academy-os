'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, FileText, Pin, Plus, Save, Search, Trash2 } from 'lucide-react';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useToast } from '@web/components/toast-provider';
import {
  type PersonalNote,
  useCreatePersonalNoteMutation,
  useDeletePersonalNoteMutation,
  useListPersonalNotesQuery,
  useUpdatePersonalNoteMutation,
} from './notes.api';
import { NOTE_CONTENT_MAX_LENGTH, NoteComposer } from './note-composer';

const blank = { title: '', content: '', isPinned: false, reminderAt: '' };

export function PersonalNotesWorkspace() {
  const { data: notes = [], isLoading } = useListPersonalNotesQuery();
  const [create, createState] = useCreatePersonalNoteMutation();
  const [update, updateState] = useUpdatePersonalNoteMutation();
  const [remove] = useDeletePersonalNoteMutation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(blank);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const { confirm } = useConfirmation();
  const selected = notes.find((note) => note.id === selectedId);

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query));
  }, [notes, search]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      title: selected.title,
      content: selected.content,
      isPinned: selected.isPinned,
      reminderAt: toLocalInput(selected.reminderAt),
    });
  }, [selected]);

  function startNew() {
    setSelectedId(null);
    setForm(blank);
    window.requestAnimationFrame(() => contentRef.current?.focus());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.content.length > NOTE_CONTENT_MAX_LENGTH) {
      toast.error('This note is too long to save.');
      return;
    }
    const body = {
      title: form.title,
      content: form.content,
      isPinned: form.isPinned,
      reminderAt: form.reminderAt ? new Date(form.reminderAt).toISOString() : null,
    };
    try {
      const saved = selectedId
        ? await update({ id: selectedId, body }).unwrap()
        : await create(body).unwrap();
      setSelectedId(saved.id);
      toast.success(selectedId ? 'Personal note updated.' : 'Personal note saved.');
    } catch {
      toast.error('Your note could not be saved.');
    }
  }

  async function deleteSelected(note: PersonalNote) {
    if (!(await confirm({
      title: `Delete “${note.title}”?`,
      description: 'This removes the note from your private notebook and cannot be undone.',
      confirmLabel: 'Delete note',
    }))) return;
    try {
      await remove(note.id).unwrap();
      startNew();
      toast.success('Personal note deleted.');
    } catch {
      toast.error('The note could not be deleted.');
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-[-.04em]">My notebook</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A private place for your daily tasks, lesson reminders, lists and working notes. Only you can see it.
          </p>
        </div>
        <button type="button" className="button-primary inline-flex items-center gap-2" onClick={startNew}>
          <Plus size={16} /> New note
        </button>
      </header>

      <div className="grid min-h-[38rem] gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-3 border-b border-border pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <label className="relative block">
            <span className="sr-only">Search personal notes</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input className="field field-with-leading-icon" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notebook" />
          </label>
          <div className="grid max-h-[33rem] gap-1 overflow-y-auto" aria-label="Personal notes">
            {visibleNotes.map((note) => (
              <button
                type="button"
                key={note.id}
                className={`rounded-xl px-3 py-3 text-left transition-colors ${selectedId === note.id ? 'bg-teal-50 text-teal-950 dark:bg-teal-950 dark:text-teal-50' : 'hover:bg-muted/60'}`}
                onClick={() => setSelectedId(note.id)}
              >
                <span className="flex items-center gap-2 font-semibold">
                  {note.isPinned ? <Pin aria-label="Pinned" size={14} /> : null}
                  <span className="truncate">{note.title}</span>
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{relativeDate(note.updatedAt)}</span>
                {note.reminderAt ? <span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Bell size={12} /> {formatReminder(note.reminderAt)}</span> : null}
              </button>
            ))}
            {!isLoading && !visibleNotes.length ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                <FileText className="mx-auto mb-2" size={22} />
                {notes.length ? 'No notes match your search.' : 'Your notebook is ready for its first note.'}
              </div>
            ) : null}
          </div>
        </aside>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-4 rounded-xl bg-muted/40 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.isPinned} onChange={(event) => setForm({ ...form, isPinned: event.target.checked })} />
              <Pin size={15} /> Pin this note
            </label>
            <label className="grid flex-1 gap-1 text-sm font-medium sm:min-w-64">
              Reminder
              <input type="datetime-local" className="field" value={form.reminderAt} onChange={(event) => setForm({ ...form, reminderAt: event.target.value })} />
            </label>
          </div>
          <NoteComposer form={form} onChange={(next) => setForm({ ...form, ...next })} contentRef={contentRef} onValidationError={toast.error} showPreview />
          <div className="sticky bottom-4 flex flex-wrap justify-end gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
            {selected ? (
              <button type="button" className="button-secondary inline-flex items-center gap-2 text-destructive" onClick={() => void deleteSelected(selected)}>
                <Trash2 size={16} /> Delete
              </button>
            ) : null}
            <button className="button-primary inline-flex items-center gap-2" disabled={createState.isLoading || updateState.isLoading}>
              <Save size={16} /> {createState.isLoading || updateState.isLoading ? 'Saving…' : selected ? 'Save changes' : 'Save note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toLocalInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function relativeDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short' }).format(new Date(value));
}

function formatReminder(value: string) {
  return new Intl.DateTimeFormat('en-PK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}
