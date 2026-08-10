'use client';
import Link from 'next/link';
import { ArrowUpRight, BookOpenCheck, ClipboardPlus, UserRoundPlus } from 'lucide-react';
import { useAppSelector } from '@web/store/hooks';
const actions = [
  {
    href: '/admissions',
    label: 'Review admissions',
    detail: 'Open the pending queue',
    icon: ClipboardPlus,
  },
  {
    href: '/academics',
    label: 'Set up academics',
    detail: 'Classes, groups, subjects',
    icon: BookOpenCheck,
  },
  {
    href: '/staff',
    label: 'Add a staff member',
    detail: 'Create access and kiosk PIN',
    icon: UserRoundPlus,
  },
];
export function DashboardHome() {
  const user = useAppSelector((state) => state.auth.user);
  return (
    <section>
      <div className="max-w-2xl">
        <p className="eyebrow">Today’s desk</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-.045em] sm:text-5xl">
          Good to see you, {user?.fullName.split(' ')[0]}.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Your workspace is ready. Start with the setup that makes your daily operations easier.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {actions
          .filter((action) => user?.accountType === 'ADMIN' || action.href === '/academics')
          .map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-lg"
            >
              <Icon className="text-teal-600" size={22} />
              <h2 className="mt-8 font-semibold">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
              <ArrowUpRight
                className="mt-5 transition group-hover:translate-x-1 group-hover:-translate-y-1"
                size={17}
              />
            </Link>
          ))}
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-teal-700/35 bg-teal-50/60 p-6 dark:bg-teal-950/15">
        <p className="eyebrow text-teal-700 dark:text-teal-300">Build the routine</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          This dashboard will become a live daily summary as each operational module is connected.
          The next frontend checkpoint is organization and branch setup.
        </p>
      </div>
    </section>
  );
}
