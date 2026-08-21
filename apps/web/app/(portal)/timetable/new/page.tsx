import { AuthGuard } from '@web/features/auth/auth-guard';
import { TimetableProfileEditor } from '@web/features/timetable/timetable-profile-editor';

export default function NewTimetableProfilePage() {
  return (
    <AuthGuard allowed={['ADMIN']}>
      <TimetableProfileEditor />
    </AuthGuard>
  );
}
