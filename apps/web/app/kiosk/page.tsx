import { AttendanceKiosk } from '@web/features/kiosk/attendance-kiosk';

// Public device route. No portal authentication; PIN validation happens per action.
export default function KioskPage() {
  return <AttendanceKiosk />;
}
