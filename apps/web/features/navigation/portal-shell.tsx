'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  Building2,
  CalendarDays,
  CalendarClock,
  Megaphone,
  ChartNoAxesCombined,
  ClipboardCheck,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  ScrollText,
  X,
  UserRoundCog,
  Users,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@web/store/hooks';
import { signOut } from '@web/store/slices/auth-slice';
import { useTheme } from '@web/features/theme/theme-provider';
const navigationGroups = [
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['ADMIN'] },
      {
        href: '/staff/dashboard',
        label: 'Overview',
        icon: LayoutDashboard,
        roles: ['STAFF'],
      },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/admissions', label: 'Admissions', icon: ClipboardCheck, roles: ['ADMIN'] },
      { href: '/students', label: 'Students', icon: Users, roles: ['ADMIN'] },
      { href: '/staff', label: 'Staff', icon: UserRoundCog, roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Teaching',
    items: [
      { href: '/academics', label: 'Academics', icon: BookOpen, roles: ['ADMIN'] },
      {
        href: '/attendance',
        label: 'Attendance',
        icon: CalendarDays,
        roles: ['ADMIN', 'STAFF'],
      },
      {
        href: '/timetable',
        label: 'Timetable',
        icon: CalendarClock,
        roles: ['ADMIN', 'STAFF'],
      },
      { href: '/grades', label: 'Grades', icon: ChartNoAxesCombined, roles: ['ADMIN'] },
      { href: '/syllabus', label: 'Syllabus', icon: ScrollText, roles: ['ADMIN', 'STAFF'] },
      { href: '/notes', label: 'Notes', icon: NotebookPen, roles: ['ADMIN', 'STAFF'] },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/finance', label: 'Finance', icon: CircleDollarSign, roles: ['ADMIN'] },
      { href: '/announcements', label: 'Announcements', icon: Megaphone, roles: ['ADMIN'] },
    ],
  },
  {
    label: 'System',
    items: [
      {
        href: '/settings/organization',
        label: 'Settings',
        icon: Settings,
        roles: ['ADMIN'],
      },
    ],
  },
];
export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { theme, setTheme } = useTheme();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const homePath = user?.accountType === 'STAFF' ? '/staff/dashboard' : '/dashboard';
  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [pathname]);
  return (
    <div className="min-h-screen bg-background lg:grid lg:h-screen lg:grid-cols-[16.25rem_1fr] lg:overflow-hidden">
      {mobileNavigationOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileNavigationOpen(false)}
        />
      ) : null}
      <aside
        id="portal-navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(18rem,86vw)] flex-col overflow-hidden bg-ink px-4 py-6 text-slate-300 shadow-2xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:h-screen lg:w-auto lg:translate-x-0 lg:shadow-none ${mobileNavigationOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between lg:block">
          <Link href={homePath} className="px-3 font-display text-2xl tracking-[-.04em] text-white">
            academy<span className="text-teal-300">OS</span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-300 lg:hidden"
            onClick={() => setMobileNavigationOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
          <nav className="grid gap-5 pb-5" aria-label="Main navigation">
            {navigationGroups.map((group) => {
              const visibleItems = group.items.filter(
                (item) => user && item.roles.includes(user.accountType),
              );
              if (!visibleItems.length) return null;
              return (
                <section key={group.label} aria-labelledby={`nav-${group.label.toLowerCase()}`}>
                  <h2
                    id={`nav-${group.label.toLowerCase()}`}
                    className="px-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    {group.label}
                  </h2>
                  <div className="grid gap-1">
                    {visibleItems.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setMobileNavigationOpen(false)}
                        className={`nav-link ${pathname === href ? 'nav-link-active' : ''}`}
                      >
                        <Icon size={18} />
                        {label}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </nav>
        </div>
        <div className="shrink-0 space-y-3 border-t border-white/10 pt-4">
          <div className="px-3 text-sm">
            <p className="font-medium text-white">{user?.fullName}</p>
            <p className="mt-0.5 text-xs text-slate-400">{user?.accountType.toLowerCase()}</p>
          </div>
          <label className="grid gap-1 px-3 text-xs text-slate-400">
            Appearance
            <select
              aria-label="Color theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value as 'light' | 'dark' | 'system')}
              className="portal-theme-select rounded-md border border-white/15 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-teal-300"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
          <button
            onClick={() => {
              setMobileNavigationOpen(false);
              dispatch(signOut());
            }}
            className="nav-link w-full"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 lg:h-screen lg:overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur lg:px-9">
          <div className="flex items-center gap-3 lg:contents">
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-controls="portal-navigation"
              aria-expanded={mobileNavigationOpen}
              className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-teal-500 lg:hidden"
              onClick={() => setMobileNavigationOpen(true)}
            >
              <Menu size={20} />
            </button>
            <Link
              href={homePath}
              className="font-display text-xl text-ink dark:text-white lg:hidden"
            >
              academy<span className="text-teal-600">OS</span>
            </Link>
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">
            {new Intl.DateTimeFormat('en-PK', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date())}
          </p>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <Building2 size={16} className="text-teal-600" />
            <span>{user?.fullName}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10 xl:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
