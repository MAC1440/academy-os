import { PersonalNotesWorkspace } from '@web/features/notes/personal-notes-workspace';

// Role: STAFF. The API scopes every note to the signed-in teacher.
export default function MyNotesPage() {
  return <PersonalNotesWorkspace />;
}
