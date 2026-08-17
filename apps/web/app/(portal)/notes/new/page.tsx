import { NoteFormScreen } from '@web/features/notes';

// Roles: ADMIN and STAFF create shared notes. The backend remains authoritative.
export default function NewNotePage() {
  return <NoteFormScreen />;
}
