import { AttendanceManagement } from '@web/features/attendance';

// Roles: ADMIN, STAFF. Backend authorization controls attendance mutations and reporting.
export default function AttendancePage() {
  return <AttendanceManagement />;
}
