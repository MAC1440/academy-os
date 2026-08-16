import { PortalRouteGuard } from '@web/features/auth';
import { PortalShell } from '@web/features/navigation';
import type { ReactNode } from 'react';

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <PortalRouteGuard>
      <PortalShell>{children}</PortalShell>
    </PortalRouteGuard>
  );
}
