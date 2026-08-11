'use client';

import Link from 'next/link';
import { ArrowRight, BookOpenCheck, ClipboardPlus, UserRoundPlus } from 'lucide-react';
import { useAppSelector } from '@web/store/hooks';

const actions = [
  {
    href: '/admissions',
    label: 'Review admissions',
    detail: 'See new applications and make a decision.',
    icon: ClipboardPlus,
  },
  {
    href: '/academics',
    label: 'Set up academics',
    detail: 'Manage classes, subjects, groups, and offerings.',
    icon: BookOpenCheck,
  },
  {
    href: '/staff',
    label: 'Add a staff member',
    detail: 'Create an account, campus access, and kiosk PIN.',
    icon: UserRoundPlus,
  },
];

export function DashboardHome() {
  const user = useAppSelector((state) => state.auth.user);
  const firstName = user?.fullName.split(' ')[0] || 'there';
  const visibleActions = actions.filter(
    (action) => user?.accountType === 'ADMIN' || action.href === '/academics',
  );
  const primaryAction =
    user?.accountType === 'ADMIN'
      ? { href: '/admissions', label: 'Review admissions' }
      : { href: '/academics', label: 'Open academics' };

  return (
    <section className="max-w-6xl">
      <div className="grid gap-8 border-b border-border pb-9 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-[-.04em] sm:text-5xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            Pick up where you left off. Everything you need for the day is one step away.
          </p>
        </div>
        <Link
          href={primaryAction.href}
          className="button-primary inline-flex items-center justify-center gap-2"
        >
          {primaryAction.label}
          <ArrowRight size={17} />
        </Link>
      </div>

      <div className="mt-8 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl tracking-[-.025em]">What would you like to do?</h2>
        <p className="hidden text-sm text-muted-foreground sm:block">Choose a task to continue.</p>
      </div>
      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {visibleActions.map(({ href, label, detail, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group grid gap-3 px-5 py-5 transition hover:bg-muted/45 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
          >
            <Icon className="text-teal-600" size={20} />
            <div>
              <h3 className="font-semibold">{label}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
            </div>
            <ArrowRight
              className="hidden text-muted-foreground transition group-hover:translate-x-1 group-hover:text-teal-700 sm:block"
              size={18}
            />
          </Link>
        ))}
      </div>
      {user?.accountType === 'ADMIN' ? (
        <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">
          New here? Start with{' '}
          <Link
            href="/settings/organization"
            className="font-semibold text-teal-700 underline underline-offset-4"
          >
            organization settings
          </Link>{' '}
          to add campuses and academic terms.
        </p>
      ) : null}
    </section>
  );
}
