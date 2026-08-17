import { AuthGuard } from '@web/features/auth';
import { SyllabusFormScreen } from '@web/features/syllabus';

export default function NewSyllabusPage() {
  return (
    <AuthGuard allowed={['ADMIN']}>
      <SyllabusFormScreen />
    </AuthGuard>
  );
}
