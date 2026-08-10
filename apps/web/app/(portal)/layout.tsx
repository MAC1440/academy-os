import { AuthGuard } from '@web/features/auth';
import { PortalShell } from '@web/features/navigation';
import type { ReactNode } from 'react';

// Roles: ADMIN, STAFF, LEARNER. Backend authorization remains authoritative.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <PortalShell>{children}</PortalShell>
    </AuthGuard>
  );
}
