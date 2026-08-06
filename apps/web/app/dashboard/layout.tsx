import { AuthGuard } from "@web/features/auth/auth-guard";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return <AuthGuard>{children}</AuthGuard>;
}
