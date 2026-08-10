import { AuthGuard } from "@web/features/auth";
import { PortalShell } from "@web/features/navigation";
// Roles: ADMIN, STAFF, LEARNER. Backend authorization remains authoritative.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) { return <AuthGuard><PortalShell>{children}</PortalShell></AuthGuard>; }
