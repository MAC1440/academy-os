import { NoteDetailScreen } from '@web/features/notes';

export default async function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = await params;
  return <NoteDetailScreen noteId={noteId} />;
}
