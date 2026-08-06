import { AuthGuard } from "@web/features/auth/auth-guard";
import { AppShell } from "@web/features/navigation/app-shell";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <AuthGuard><AppShell>{children}</AppShell></AuthGuard>;
}
