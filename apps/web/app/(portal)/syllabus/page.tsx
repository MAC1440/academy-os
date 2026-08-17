import { SyllabusManagement } from '@web/features/syllabus';

// Roles: ADMIN manages; STAFF has school-wide read-only access.
export default function SyllabusPage() {
  return <SyllabusManagement />;
}
