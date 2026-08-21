'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@web/features/auth/auth-guard';
import { TimetableProfileView } from '@web/features/timetable/timetable-profile-view';

export default function TimetableProfilePage() {
  const { profileId } = useParams<{ profileId: string }>();
  return <AuthGuard allowed={['ADMIN']}><TimetableProfileView profileId={profileId} /></AuthGuard>;
}
