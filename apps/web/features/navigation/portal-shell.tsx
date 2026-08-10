'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Settings,
  UserRoundCog,
  Users,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@web/store/hooks';
import { signOut } from '@web/store/slices/auth-slice';
import { useTheme } from '@web/features/theme/theme-provider';
const items = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'STAFF', 'LEARNER'],
  },
  { href: '/admissions', label: 'Admissions', icon: ClipboardCheck, roles: ['ADMIN'] },
  { href: '/academics', label: 'Academics', icon: BookOpen, roles: ['ADMIN', 'STAFF'] },
  { href: '/students', label: 'Students', icon: Users, roles: ['ADMIN', 'STAFF', 'LEARNER'] },
  {
    href: '/attendance',
    label: 'Attendance',
    icon: CalendarDays,
    roles: ['ADMIN', 'STAFF', 'LEARNER'],
  },
  { href: '/notes', label: 'Notes', icon: NotebookPen, roles: ['ADMIN', 'STAFF'] },
  { href: '/staff', label: 'Staff', icon: UserRoundCog, roles: ['ADMIN'] },
  { href: '/settings/organization', label: 'Settings', icon: Settings, roles: ['ADMIN'] },
];
export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { theme, setTheme } = useTheme();
  return (
    <div className="min-h-screen bg-background lg:grid lg:h-screen lg:grid-cols-[16.25rem_1fr] lg:overflow-hidden">
      <aside className="hidden h-screen flex-col overflow-hidden bg-ink px-4 py-6 text-slate-300 lg:flex">
        <Link href="/dashboard" className="px-3 font-display text-2xl tracking-[-.04em] text-white">
          academy<span className="text-teal-300">OS</span>
        </Link>
        <p className="mt-1 px-3 text-xs text-slate-400">Your operations desk</p>
        <nav className="mt-10 grid gap-1">
          {items
            .filter((item) => user && item.roles.includes(user.accountType))
            .map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${pathname === href ? 'nav-link-active' : ''}`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <div className="px-3 text-sm">
            <p className="font-medium text-white">{user?.fullName}</p>
            <p className="mt-0.5 text-xs text-slate-400">{user?.accountType.toLowerCase()}</p>
          </div>
          <div className="flex gap-1 px-2">
            {(['light', 'dark', 'system'] as const).map((value) => (
              <button
                key={value}
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
                className="rounded-md px-2 py-1 text-xs hover:bg-white/10"
              >
                {value}
              </button>
            ))}
          </div>
          <button onClick={() => dispatch(signOut())} className="nav-link w-full">
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 lg:h-screen lg:overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 backdrop-blur lg:px-9">
          <Link
            href="/dashboard"
            className="font-display text-xl text-ink dark:text-white lg:hidden"
          >
            academy<span className="text-teal-600">OS</span>
          </Link>
          <p className="hidden text-sm text-muted-foreground lg:block">
            {new Intl.DateTimeFormat('en-PK', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            }).format(new Date())}
          </p>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-teal-600" />
            <span className="text-sm font-medium">Workspace</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10 xl:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
