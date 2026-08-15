import { TimetableManagement } from '@web/features/timetable/timetable-management';

// Roles: ADMIN and STAFF. Backend remains authoritative for timetable changes.
export default function TimetablePage() { return <TimetableManagement />; }
