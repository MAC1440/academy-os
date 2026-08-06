import { AuthGuard } from "@web/features/auth/auth-guard";

export default function OrganizationsLayout({ children }: LayoutProps<"/organizations">) {
  return <AuthGuard>{children}</AuthGuard>;
}
