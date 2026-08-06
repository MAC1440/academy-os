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
    <label className="flex items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-xs text-white/80">
      Appearance
      <select
        aria-label="Theme"
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeMode)}
        className="bg-transparent text-right font-semibold text-white outline-none"
      >
        <option className="text-[#470004]" value="system">System</option>
        <option className="text-[#470004]" value="light">Light</option>
        <option className="text-[#470004]" value="dark">Dark</option>
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
    <div className="min-h-screen bg-[#f7f1ea] text-[#3d1013] transition-colors dark:bg-[#151112] dark:text-[#f7eee8]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/10 bg-[#470004] px-5 py-6 text-white lg:flex">
        <Link href="/dashboard" className="group flex items-center gap-3 rounded-2xl px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#f3d58b]">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#f3d58b] font-mono text-xs font-black tracking-tighter text-[#470004]">AO</span>
          <span>
            <span className="block text-lg font-semibold tracking-tight">AcademyOS</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f3d58b]">Operations desk</span>
          </span>
        </Link>

        <div className="mt-10">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Primary navigation">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#f3d58b] ${active ? "bg-[#f3d58b] text-[#470004] shadow-[0_10px_24px_rgba(0,0,0,0.18)]" : "text-white/72 hover:bg-white/10 hover:text-white"}`}
                >
                  <span className={`grid size-7 place-items-center rounded-lg text-[10px] font-bold ${active ? "bg-[#470004]/10" : "bg-white/10"}`}>{item.initials}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-8">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">Coming next</p>
          <ul className="mt-3 space-y-1 px-3 text-sm text-white/45">
            {upcoming.map((item) => <li key={item} className="py-1.5">{item}</li>)}
          </ul>
        </div>

        <div className="mt-auto space-y-3">
          <ThemeControl />
          <div className="rounded-2xl border border-white/12 bg-white/8 p-3">
            <p className="truncate text-sm font-semibold">{user.email}</p>
            <p className="mt-1 text-xs text-white/55">Signed in securely</p>
            <button type="button" onClick={logout} className="mt-3 text-xs font-semibold text-[#f3d58b] underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-[#f3d58b]">Sign out</button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-[#470004]/10 bg-[#f7f1ea]/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-[#151112]/90 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="font-semibold text-[#470004] dark:text-[#f7eee8]">AcademyOS</Link>
          <ThemeControl />
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? "bg-[#470004] text-white" : "bg-[#470004]/5 text-[#470004] dark:bg-white/10 dark:text-white"}`}>{item.label}</Link>
          ))}
        </nav>
      </header>

      <div className="lg:pl-72">{children}</div>
    </div>
  );
}
