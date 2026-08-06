import { AuthGuard } from "@web/features/auth/auth-guard";
import { AppShell } from "@web/features/navigation/app-shell";

export default function OrganizationsLayout({ children }: LayoutProps<"/organizations">) {
  return <AuthGuard><AppShell>{children}</AppShell></AuthGuard>;
}
