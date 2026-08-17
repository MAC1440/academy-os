'use client';

import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConfirmation } from '@web/components/confirmation-dialog';
import { useToast } from '@web/components/toast-provider';
import { useAppSelector } from '@web/store/hooks';
import { useDeleteNoteMutation, useGetNoteQuery } from './notes.api';
import { NoteRichText } from './note-rich-text';

export function NoteDetailScreen({ noteId }: { noteId: string }) {
  const note = useGetNoteQuery(noteId);
  const [remove, removeState] = useDeleteNoteMutation();
  const canDelete = useAppSelector((state) => state.auth.user?.accountType === 'ADMIN');
  const { confirm } = useConfirmation();
  const toast = useToast();
  const router = useRouter();

  async function archive() {
    if (
      !(await confirm({
        title: 'Remove this note?',
        description:
          'This shared note will no longer be available to staff. This cannot be undone.',
        confirmLabel: 'Remove note',
      }))
    )
      return;
    try {
      await remove(noteId).unwrap();
      toast.success('Note removed.');
      router.push('/notes');
    } catch {
      toast.error('The note could not be removed.');
    }
  }

  if (note.isLoading) return <p className="text-sm text-muted-foreground">Loading note…</p>;
  if (note.isError || !note.data)
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border p-8 text-center">
        <h1 className="font-display text-2xl">Note unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been removed or you may no longer have access.
        </p>
        <Link href="/notes" className="button-primary mt-5 inline-flex">
          Return to notes
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-border pb-6">
        <Link
          href="/notes"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:underline"
        >
          <ArrowLeft size={16} /> All notes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <h1 className="text-balance font-display text-4xl tracking-[-.04em]">
              {note.data.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Created by {note.data.author?.fullName ?? 'Team member'} · Last edited{' '}
              {formatDate(note.data.updatedAt)} by{' '}
              {note.data.lastEditedBy?.fullName ?? note.data.author?.fullName ?? 'Team member'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/notes/${noteId}/edit`}
              className="button-secondary inline-flex items-center gap-2"
            >
              <Pencil size={16} /> Edit
            </Link>
            {canDelete ? (
              <button
                type="button"
                className="button-destructive inline-flex items-center gap-2"
                disabled={removeState.isLoading}
                onClick={archive}
              >
                <Trash2 size={16} /> Remove
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <article className="min-h-72 rounded-2xl bg-card px-6 py-7 sm:px-9 sm:py-10">
        <NoteRichText content={note.data.content} />
      </article>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
