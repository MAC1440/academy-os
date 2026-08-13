import { LearnerDashboard } from '@web/features/learner-portal/learner-dashboard';
import { AuthGuard } from '@web/features/auth';
export default function StudentDashboardPage() {
  return (
    <AuthGuard allowed={['LEARNER']}>
      <LearnerDashboard />
    </AuthGuard>
  );
}
