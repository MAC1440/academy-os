'use client';

import { skipToken } from '@reduxjs/toolkit/query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useToast } from '@web/components/toast-provider';
import { useCreateNoteMutation, useGetNoteQuery, useUpdateNoteMutation } from './notes.api';
import { NOTE_CONTENT_MAX_LENGTH, NoteComposer } from './note-composer';

export function NoteFormScreen({ noteId }: { noteId?: string }) {
  const editing = Boolean(noteId);
  const note = useGetNoteQuery(noteId || skipToken);
  const [create, createState] = useCreateNoteMutation();
  const [update, updateState] = useUpdateNoteMutation();
  const [form, setForm] = useState({ title: '', content: '' });
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (note.data) setForm({ title: note.data.title, content: note.data.content });
  }, [note.data]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.content.length > NOTE_CONTENT_MAX_LENGTH) {
      toast.error(
        `This note exceeds the ${NOTE_CONTENT_MAX_LENGTH.toLocaleString()} character limit.`,
      );
      return;
    }
    try {
      const saved = editing
        ? await update({ id: noteId!, body: form }).unwrap()
        : await create(form).unwrap();
      toast.success(editing ? 'Note updated.' : 'Note shared with your team.');
      router.push(`/notes/${saved.id}`);
    } catch {
      toast.error(editing ? 'The note could not be updated.' : 'The note could not be saved.');
    }
  }

  if (editing && note.isLoading)
    return <p className="text-sm text-muted-foreground">Loading note…</p>;
  if (editing && (note.isError || !note.data))
    return <NoteUnavailable message="This note could not be loaded. It may have been removed." />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href={editing ? `/notes/${noteId}` : '/notes'}
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:underline"
          >
            <ArrowLeft size={16} /> {editing ? 'Back to note' : 'Back to notes'}
          </Link>
          <h1 className="font-display text-4xl tracking-[-.04em]">
            {editing ? 'Edit note' : 'Create a shared note'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Write with Markdown and mathematical notation, then use the preview to check the final
            reading experience.
          </p>
        </div>
      </header>
      <form onSubmit={submit} className="space-y-5">
        <NoteComposer
          form={form}
          onChange={setForm}
          contentRef={contentRef}
          onValidationError={toast.error}
          showPreview
        />
        <div className="sticky bottom-4 flex justify-end gap-2 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
          <Link href={editing ? `/notes/${noteId}` : '/notes'} className="button-secondary">
            Cancel
          </Link>
          <button
            className="button-primary inline-flex items-center gap-2"
            disabled={createState.isLoading || updateState.isLoading}
          >
            <Save size={16} />
            {createState.isLoading || updateState.isLoading
              ? 'Saving…'
              : editing
                ? 'Save changes'
                : 'Share note'}
          </button>
        </div>
      </form>
    </div>
  );
}

function NoteUnavailable({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border p-8 text-center">
      <h1 className="font-display text-2xl">Note unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Link href="/notes" className="button-primary mt-5 inline-flex">
        Return to notes
      </Link>
    </div>
  );
}
