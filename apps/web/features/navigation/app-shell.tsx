"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@web/features/auth/auth-guard";
import { type ThemeMode, useTheme } from "@web/features/theme/theme-provider";

const navigation = [
  { href: "/dashboard", label: "Overview", initials: "OV" },
  { href: "/organizations", label: "Organization", initials: "OR" },
];

const upcoming = ["People", "Academics", "Attendance", "Reports"];

function ThemeControl() {
  const { theme, setTheme } = useTheme();

  return (
    <label className="group flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/10 px-4 py-3 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-cyan-400/30 hover:shadow-cyan-500/10">
      <div>
        <p className="text-sm font-semibold text-white">Appearance</p>
        <p className="text-xs text-white/50">Choose your preferred theme</p>
      </div>

      <select
        aria-label="Theme"
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeMode)}
        className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm outline-none transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
      >
        <option className="bg-slate-900" value="system">
          System
        </option>
        <option className="bg-slate-900" value="light">
          Light
        </option>
        <option className="bg-slate-900" value="dark">
          Dark
        </option>
      </select>
    </label>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  function logout() {
    localStorage.removeItem("accessToken");
    router.push("/login");
  }

  return (
<div className="min-h-screen bg-background text-foreground transition-colors">
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-border bg-sidebar text-sidebar-foreground px-5 py-6 lg:flex">
    <Link
      href="/dashboard"
      className="group flex items-center gap-3 rounded-2xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-secondary font-mono text-xs font-black tracking-tighter text-secondary-foreground">
        AO
      </span>

      <span>
        <span className="block text-lg font-semibold tracking-tight">
          AcademyOS
        </span>

        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">
          Operations desk
        </span>
      </span>
    </Link>

    <div className="mt-10">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/50">
        Workspace
      </p>

      <nav className="mt-3 space-y-1" aria-label="Primary navigation">
        {navigation.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring ${
                active
                  ? "bg-secondary text-secondary-foreground shadow-lg"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
              }`}
            >
              <span
                className={`grid size-7 place-items-center rounded-lg text-[10px] font-bold transition-colors ${
                  active
                    ? "bg-primary/10 text-secondary-foreground"
                    : "bg-sidebar-foreground/10 text-sidebar-foreground"
                }`}
              >
                {item.initials}
              </span>

              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>

    <div className="mt-8">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/50">
        Coming next
      </p>

      <ul className="mt-3 space-y-1 px-3 text-sm text-sidebar-foreground/50">
        {upcoming.map((item) => (
          <li
            key={item}
            className="rounded-lg py-1.5 transition-colors hover:text-sidebar-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>

    <div className="mt-auto space-y-3">
      <ThemeControl />

      <div className="rounded-2xl border border-border bg-card p-3 text-card-foreground shadow-sm">
        <p className="truncate text-sm font-semibold">{user.email}</p>

        <p className="mt-1 text-xs text-muted-foreground">
          Signed in securely
        </p>

        <button
          type="button"
          onClick={logout}
          className="mt-3 text-xs font-semibold text-primary underline-offset-4 transition hover:text-secondary hover:underline focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Sign out
        </button>
      </div>
    </div>
  </aside>

  <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
    <div className="flex items-center justify-between gap-3">
      <Link
        href="/dashboard"
        className="font-semibold text-foreground"
      >
        AcademyOS
      </Link>

      <ThemeControl />
    </div>

    <nav
      className="mt-3 flex gap-2 overflow-x-auto"
      aria-label="Primary navigation"
    >
      {navigation.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-foreground hover:bg-surface-2"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  </header>

  <div className="lg:pl-72">{children}</div>
</div>
  );
}
