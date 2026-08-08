'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Building2,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Sun,
  Users,
  GraduationCap,
  ClipboardCheck,
  FileBarChart,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '@web/features/auth/auth-guard';
import { type ThemeMode, useTheme } from '@web/features/theme/theme-provider';

import { Button } from '@web/components/ui/button';
import { Card } from '@web/components/ui/card';

const navigation = [
  {
    href: '/dashboard',
    label: 'Overview',
    description: 'Your academy at a glance',
    icon: BarChart3,
  },
  {
    href: '/organizations',
    label: 'Organization',
    description: 'Manage your organization',
    icon: Building2,
  },
];

const upcoming = [
  {
    label: 'People',
    icon: Users,
  },
  {
    label: 'Academics',
    icon: GraduationCap,
  },
  {
    label: 'Attendance',
    icon: ClipboardCheck,
  },
  {
    label: 'Reports',
    icon: FileBarChart,
  },
];

function ThemeControl() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
    },
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
    },
  ];

  const currentTheme = themeOptions.find((option) => option.value === theme) ?? themeOptions[0];

  const CurrentIcon = currentTheme?.icon;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Palette className="size-3.5 text-muted-foreground" />

        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Appearance
        </p>
      </div>

      <div className="relative">
        {CurrentIcon && (
          <CurrentIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}

        <select
          aria-label="Theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value as ThemeMode)}
          className="
            h-10
            w-full
            appearance-none
            rounded-xl
            border
            border-border
            bg-card
            pl-10
            pr-9
            text-sm
            font-medium
            text-card-foreground
            shadow-sm
            outline-none
            transition-all
            hover:border-primary/30
            focus:border-primary
            focus:ring-2
            focus:ring-primary/15
          "
        >
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function AcademyLogo() {
  return (
    <Link
      href="/dashboard"
      className="
        group
        flex
        items-center
        gap-3
        rounded-2xl
        px-2
        py-2
        outline-none
        transition-colors
        focus-visible:ring-2
        focus-visible:ring-ring
      "
    >
      <div
        className="
          grid
          size-10
          shrink-0
          place-items-center
          rounded-xl
          bg-primary
          text-primary-foreground
          shadow-lg
          shadow-primary/20
          transition-transform
          duration-200
          group-hover:scale-105
        "
      >
        <GraduationCap className="size-5" />
      </div>

      <div className="min-w-0">
        <span className="block truncate text-lg font-bold tracking-tight text-sidebar-foreground">
          AcademyOS
        </span>

        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.2em] text-secondary">
          Operations desk
        </span>
      </div>
    </Link>
  );
}

function UserCard({ email, onLogout }: { email?: string | null; onLogout: () => void }) {
  const initials = email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <Card className="border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div
          className="
            grid
            size-9
            shrink-0
            place-items-center
            rounded-xl
            bg-primary/10
            text-sm
            font-bold
            text-primary
          "
        >
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-card-foreground">
            {email || 'Account'}
          </p>

          <p className="mt-0.5 text-[11px] text-muted-foreground">Signed in securely</p>
        </div>

        <CircleUserRound className="size-4 shrink-0 text-muted-foreground" />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="
          mt-3
          h-9
          w-full
          justify-start
          gap-2
          px-2.5
          text-muted-foreground
          hover:bg-destructive/10
          hover:text-destructive
        "
      >
        <LogOut className="size-4" />
        Sign out
      </Button>
    </Card>
  );
}

function SidebarNavigation({ pathname }: { pathname: string }) {
  return (
    <>
      <div>
        <div className="mb-3 flex items-center justify-between px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-foreground/45">
            Workspace
          </p>

          <span className="rounded-full bg-sidebar-foreground/5 px-2 py-0.5 text-[9px] font-medium text-sidebar-foreground/40">
            CORE
          </span>
        </div>

        <nav className="space-y-1.5" aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`
                      group
                      relative
                      flex
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-2.5
                      outline-none
                      transition-all
                      duration-200
                      focus-visible:ring-2
                      focus-visible:ring-ring
                      ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15'
                          : 'text-sidebar-foreground/65 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground'
                      }
`}
              >
                {active && (
                  <span
                    className="
                      absolute
                      -left-px
                      top-2.5
                      h-6
                      w-0.5
                      rounded-full
                      bg-primary
                    "
                  />
                )}

                <span
                  className={`
                    grid
                    size-9
                    shrink-0
                    place-items-center
                    rounded-lg
                    transition-all
                  ${
                    active
                      ? 'bg-primary-foreground/15 text-primary-foreground'
                      : 'bg-sidebar-foreground/5 text-sidebar-foreground/55 group-hover:bg-sidebar-foreground/10 group-hover:text-sidebar-foreground'
                  }
                  `}
                >
                  <Icon className="size-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{item.label}</span>

                  <span
                    className={`
                      mt-0.5 block truncate text-[10px]
                      ${active ? 'text-primary-foreground/70' : 'text-sidebar-foreground/40'}
                    `}
                  >
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sidebar-foreground/45">
            Coming next
          </p>

          <div className="h-px flex-1 bg-sidebar-foreground/10" />
        </div>

        <div className="space-y-1">
          {upcoming.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  px-3
                  py-2
                  text-sidebar-foreground/35
                  transition-colors
                  hover:bg-sidebar-foreground/5
                  hover:text-sidebar-foreground/60
                "
              >
                <span className="grid size-8 place-items-center rounded-lg bg-sidebar-foreground/5">
                  <Icon className="size-3.5" />
                </span>

                <span className="flex-1 text-sm font-medium">{item.label}</span>

                <span className="rounded-full border border-sidebar-foreground/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider">
                  Soon
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  function logout() {
    localStorage.removeItem('accessToken');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside
          className="
            hidden
            w-[280px]
            shrink-0
            border-r
            border-sidebar-border
            bg-sidebar
            lg:flex
            lg:flex-col
          "
        >
          <div className="flex h-full flex-col px-4 py-5">
            <AcademyLogo />

            <div className="mt-9">
              <SidebarNavigation pathname={pathname} />
            </div>

            <div className="mt-auto space-y-4 pt-8">
              <ThemeControl />

              <div className="h-px bg-sidebar-foreground/10" />

              <UserCard email={user?.email} onLogout={logout} />
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <header
            className="
              sticky
              top-0
              z-20
              border-b
              border-border/70
              bg-background/90
              px-4
              py-3
              backdrop-blur-xl
              lg:hidden
            "
          >
            <div className="flex items-center justify-between gap-4">
              <AcademyLogo />

              <div className="flex items-center gap-2">
                <ThemeControl />
              </div>
            </div>

            <nav
              className="
                mt-4
                flex
                gap-2
                overflow-x-auto
                pb-0.5
              "
              aria-label="Primary navigation"
            >
              {navigation.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex
                      shrink-0
                      items-center
                      gap-2
                      rounded-xl
                      px-3
                      py-2
                      text-sm
                      font-semibold
                      transition-all
                      ${
                        active
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          {/* Page content */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
