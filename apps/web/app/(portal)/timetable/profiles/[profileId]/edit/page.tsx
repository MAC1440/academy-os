'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@web/features/auth/auth-guard';
import { TimetableProfileEditor } from '@web/features/timetable/timetable-profile-editor';

export default function EditTimetableProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  return (
    <AuthGuard allowed={['ADMIN']}>
      <TimetableProfileEditor profileId={profileId} />
    </AuthGuard>
  );
}
