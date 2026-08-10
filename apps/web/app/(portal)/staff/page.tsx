import { StaffManagement } from '@web/features/staff';

// Roles: ADMIN. Staff may view work data but do not administer staff accounts.
export default function StaffPage() {
  return <StaffManagement />;
}
