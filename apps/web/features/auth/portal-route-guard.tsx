'use client';

import { usePathname } from 'next/navigation';
import type { AccountType } from '@web/store/slices/auth-slice';
import { AuthGuard } from './auth-guard';

const staffRoutes = ['/attendance', '/notes', '/syllabus', '/timetable'];

export function PortalRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const staffAccessible = staffRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const allowed: AccountType[] = staffAccessible ? ['ADMIN', 'STAFF'] : ['ADMIN'];
  return <AuthGuard allowed={allowed}>{children}</AuthGuard>;
}
