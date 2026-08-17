import { NoteFormScreen } from '@web/features/notes';

// Roles: ADMIN and STAFF edit shared notes. Only ADMIN can delete them.
export default async function EditNotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  return <NoteFormScreen noteId={noteId} />;
}
