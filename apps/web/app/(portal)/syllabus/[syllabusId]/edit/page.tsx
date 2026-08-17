import { AuthGuard } from '@web/features/auth';
import { SyllabusFormScreen } from '@web/features/syllabus';

export default async function EditSyllabusPage({
  params,
}: {
  params: Promise<{ syllabusId: string }>;
}) {
  const { syllabusId } = await params;
  return (
    <AuthGuard allowed={['ADMIN']}>
      <SyllabusFormScreen syllabusId={syllabusId} />
    </AuthGuard>
  );
}
