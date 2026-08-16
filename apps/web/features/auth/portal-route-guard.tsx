'use client';

import { usePathname } from 'next/navigation';
import type { AccountType } from '@web/store/slices/auth-slice';
import { AuthGuard } from './auth-guard';

const staffRoutes = ['/attendance', '/notes', '/timetable'];

export function PortalRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const allowed: AccountType[] = staffRoutes.includes(pathname) ? ['ADMIN', 'STAFF'] : ['ADMIN'];
  return <AuthGuard allowed={allowed}>{children}</AuthGuard>;
}
