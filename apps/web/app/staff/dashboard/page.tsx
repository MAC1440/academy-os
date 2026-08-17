import { AuthGuard } from '@web/features/auth/auth-guard';
import { StaffDashboard } from '@web/features/staff-portal/staff-dashboard';
import { PortalShell } from '@web/features/navigation';
export default function StaffDashboardPage() {
  return (
    <AuthGuard allowed={['STAFF']}>
      <PortalShell>
        <StaffDashboard />
      </PortalShell>
    </AuthGuard>
  );
}
