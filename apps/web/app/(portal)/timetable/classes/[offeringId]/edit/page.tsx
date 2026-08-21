'use client';

import { useParams } from 'next/navigation';
import { AuthGuard } from '@web/features/auth/auth-guard';
import { ClassTimetableScreen } from '@web/features/timetable/class-timetable-screen';

export default function EditClassTimetablePage() {
  const { offeringId } = useParams<{ offeringId: string }>();
  return <AuthGuard allowed={['ADMIN']}><ClassTimetableScreen offeringId={offeringId} editing /></AuthGuard>;
}
