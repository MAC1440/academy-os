import { AcademicsManagement } from '@web/features/academics';

// Roles: ADMIN, STAFF. The backend keeps mutation authorization authoritative.
export default function AcademicsPage() {
  return <AcademicsManagement />;
}
