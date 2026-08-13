import { AuthGuard } from '@web/features/auth/auth-guard';
import { StaffDashboard } from '@web/features/staff-portal/staff-dashboard';
export default function StaffDashboardPage() {
  return (
    <AuthGuard allowed={['STAFF']}>
      <main className="mx-auto min-h-screen w-full max-w-7xl bg-background px-5 py-8 sm:px-7 lg:px-10">
        <StaffDashboard />
      </main>
    </AuthGuard>
  );
}
