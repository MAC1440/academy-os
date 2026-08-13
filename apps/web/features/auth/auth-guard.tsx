'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMeQuery } from './auth.api';
import { useAppDispatch, useAppSelector } from '@web/store/hooks';
import { setUser, signOut, type AccountType } from '@web/store/slices/auth-slice';

export function AuthGuard({
  children,
  allowed,
}: {
  children: React.ReactNode;
  allowed?: AccountType[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { accessToken, hydrated, user } = useAppSelector((state) => state.auth);
  const query = useMeQuery(undefined, { skip: !hydrated || !accessToken });
  useEffect(() => {
    const loginPath = pathname.startsWith('/student')
      ? '/student/login'
      : pathname.startsWith('/staff/')
        ? '/staff/login'
        : '/login';
    const dashboardPath =
      user?.accountType === 'LEARNER'
        ? '/student/dashboard'
        : user?.accountType === 'STAFF'
          ? '/staff/dashboard'
          : '/dashboard';
    if (!hydrated) return;
    if (!accessToken) {
      router.replace(`${loginPath}?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (query.data) dispatch(setUser(query.data));
    if (
      query.data?.mustCompleteProfile &&
      query.data.accountType === 'LEARNER' &&
      pathname !== '/student/complete-profile'
    ) {
      router.replace('/student/complete-profile');
      return;
    }
    if (
      query.data?.mustCompleteProfile &&
      query.data.accountType === 'STAFF' &&
      pathname !== '/staff/complete-profile'
    ) {
      router.replace('/staff/complete-profile');
      return;
    }
    if (query.isError) {
      dispatch(signOut());
      router.replace(loginPath);
    }
  }, [
    accessToken,
    dispatch,
    hydrated,
    pathname,
    query.data,
    query.isError,
    router,
    user?.accountType,
  ]);
  if (!hydrated || query.isLoading || !user)
    return (
      <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Restoring your workspace…
      </main>
    );
  if (allowed && !allowed.includes(user.accountType)) {
    router.replace(
      user.accountType === 'LEARNER'
        ? '/student/dashboard'
        : user.accountType === 'STAFF'
          ? '/staff/dashboard'
          : '/dashboard',
    );
    return null;
  }
  return <>{children}</>;
}
